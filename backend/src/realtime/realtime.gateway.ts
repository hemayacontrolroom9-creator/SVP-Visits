import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket,
  MessageBody, OnGatewayInit,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
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
  cors: { origin: '*', credentials: true },
  namespace: '/realtime',
  transports: ['websocket', 'polling'],
})
export class RealtimeGateway implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(RealtimeGateway.name);
  private connectedUsers = new Map<string, string>(); // socketId -> userId

  constructor(private jwtService: JwtService) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.headers?.authorization?.split(' ')[1];
      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify(token);
      this.connectedUsers.set(client.id, payload.sub);
      client.join(`user:${payload.sub}`);
      client.join(`role:${payload.role}`);
      this.logger.log(`Client connected: ${client.id} (user: ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = this.connectedUsers.get(client.id);
    this.connectedUsers.delete(client.id);
    this.logger.log(`Client disconnected: ${client.id} (user: ${userId})`);
  }

  @SubscribeMessage('location_update')
  handleLocationUpdate(@ConnectedSocket() client: Socket, @MessageBody() data: TrackingPoint) {
    const userId = this.connectedUsers.get(client.id);
    if (!userId) return;
    this.server.to('role:admin').to('role:manager').emit('supervisor_location', {
      ...data, userId, timestamp: new Date().toISOString(),
    });
  }

  @SubscribeMessage('join_visit')
  handleJoinVisit(@ConnectedSocket() client: Socket, @MessageBody() visitId: string) {
    client.join(`visit:${visitId}`);
  }

  @OnEvent('visit.checked_in')
  handleVisitCheckedIn(payload: any) {
    this.server.to('role:admin').to('role:manager').emit('visit_update', {
      type: 'checked_in', visit: payload.visit, timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('visit.completed')
  handleVisitCompleted(payload: any) {
    this.server.to('role:admin').to('role:manager').emit('visit_update', {
      type: 'completed', visit: payload.visit, timestamp: new Date().toISOString(),
    });
  }

  @OnEvent('visit.location_updated')
  handleLocationUpdated(payload: any) {
    this.server.to('role:admin').to('role:manager').emit('supervisor_location', {
      userId: payload.userId, visitId: payload.visitId, ...payload.point,
    });
  }

  broadcastToRoom(room: string, event: string, data: any) {
    this.server.to(room).emit(event, data);
  }

  broadcastToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  broadcastToRole(role: string, event: string, data: any) {
    this.server.to(`role:${role}`).emit(event, data);
  }
}
