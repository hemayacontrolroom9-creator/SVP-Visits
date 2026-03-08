import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,
  MessageBody, OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OnEvent } from '@nestjs/event-emitter';

interface TrackingPoint {
  lat: number;
  lng: number;
  timestamp: string;
  accuracy?: number;
  userId: string;
  visitId?: string;
}

@WebSocketGateway({
  cors: {
    origin: (origin: string, callback: Function) => {
      // Allow same-origin and configured CORS origins
      const allowed = (process.env.CORS_ORIGINS || 'http://localhost:5173')
        .split(',')
        .map(o => o.trim());
      if (!origin || allowed.includes(origin) || allowed.includes('*')) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
  },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId
  private userSockets = new Map<string, Set<string>>(); // userId -> Set<socketId>

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) {
        this.logger.warn(`Client ${client.id} connected without token — disconnecting`);
        client.disconnect();
        return;
      }

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      this.connectedUsers.set(client.id, userId);

      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);

      // Join personal and role rooms
      client.join(`user:${userId}`);
      client.join(`role:${payload.role}`);

      this.logger.log(`Client connected: ${client.id} (user: ${userId})`);
    } catch (err) {
      this.logger.warn(`Invalid token from ${client.id}: ${err.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) {
        this.userSockets.delete(userId);
      }
      this.connectedUsers.delete(client.id);
    }
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_visit')
  handleJoinVisit(@ConnectedSocket() client: Socket, @MessageBody() visitId: string) {
    client.join(`visit:${visitId}`);
    return { event: 'joined_visit', data: visitId };
  }

  @SubscribeMessage('leave_visit')
  handleLeaveVisit(@ConnectedSocket() client: Socket, @MessageBody() visitId: string) {
    client.leave(`visit:${visitId}`);
    return { event: 'left_visit', data: visitId };
  }

  @SubscribeMessage('location_update')
  handleLocationUpdate(@ConnectedSocket() client: Socket, @MessageBody() point: TrackingPoint) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;

    // Broadcast to admin/manager rooms
    this.server.to('role:admin').to('role:manager').emit('supervisor_location', {
      ...point,
      userId,
      socketId: client.id,
    });

    // Broadcast to visit room if visitId provided
    if (point.visitId) {
      this.server.to(`visit:${point.visitId}`).emit('visit_location_update', point);
    }
  }

  @OnEvent('visit.checked_in')
  handleVisitCheckedIn(payload: any) {
    this.server.to('role:admin').to('role:manager').emit('visit_checked_in', payload);
    this.server.to(`visit:${payload.visitId}`).emit('visit_status_changed', payload);
  }

  @OnEvent('visit.checked_out')
  handleVisitCheckedOut(payload: any) {
    this.server.to('role:admin').to('role:manager').emit('visit_checked_out', payload);
    this.server.to(`visit:${payload.visitId}`).emit('visit_status_changed', payload);
  }

  @OnEvent('alert.created')
  handleAlertCreated(payload: any) {
    this.server.to('role:admin').to('role:manager').emit('new_alert', payload);
    if (payload.supervisorId) {
      this.server.to(`user:${payload.supervisorId}`).emit('new_alert', payload);
    }
  }

  getConnectedUsersCount(): number {
    return this.userSockets.size;
  }
}
