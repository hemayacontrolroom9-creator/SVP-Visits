import { io, Socket } from 'socket.io-client';
import { store } from '../store';
import { updateSupervisorLocation } from '../store/slices/visitsSlice';
import { addNotification } from '../store/slices/uiSlice';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:3000';

class WebSocketService {
  private socket: Socket | null = null;

  connect() {
    const token = store.getState().auth.accessToken;
    if (!token || this.socket?.connected) return;

    this.socket = io(`${WS_URL}/realtime`, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionDelay: 3000,
      reconnectionAttempts: 5,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
    });

    this.socket.on('supervisor_location', (data) => {
      store.dispatch(updateSupervisorLocation(data));
    });

    this.socket.on('visit_update', (data) => {
      store.dispatch(addNotification({
        message: `Visit ${data.type}: ${data.visit?.site?.name || ''}`,
        type: data.type === 'completed' ? 'success' : 'info',
      }));
    });

    this.socket.on('alert', (data) => {
      store.dispatch(addNotification({ message: data.message, type: 'warning' }));
    });

    this.socket.on('disconnect', () => console.log('WebSocket disconnected'));
    this.socket.on('connect_error', (err) => console.error('WS error:', err.message));
  }

  disconnect() {
    this.socket?.disconnect();
    this.socket = null;
  }

  emit(event: string, data?: any) {
    this.socket?.emit(event, data);
  }

  sendLocation(lat: number, lng: number, visitId?: string) {
    this.socket?.emit('location_update', {
      lat, lng, timestamp: new Date().toISOString(), visitId,
    });
  }

  joinVisit(visitId: string) {
    this.socket?.emit('join_visit', visitId);
  }
}

export const wsService = new WebSocketService();
