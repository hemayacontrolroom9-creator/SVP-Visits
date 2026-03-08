import { useEffect, useRef, useCallback } from 'react';
import { useAppSelector } from '../store/hooks';
import { selectAccessToken } from '../store/slices/authSlice';
import { websocketService } from '../services/websocket';
import { SupervisorLocation } from '../types';

export function useWebSocket() {
  const token = useAppSelector(selectAccessToken);
  const connectedRef = useRef(false);

  useEffect(() => {
    if (!token || connectedRef.current) return;
    websocketService.connect(token);
    connectedRef.current = true;
    return () => {
      websocketService.disconnect();
      connectedRef.current = false;
    };
  }, [token]);
}

export function useSupervisorLocations(
  onUpdate: (location: SupervisorLocation) => void,
) {
  useEffect(() => {
    const unsub = websocketService.onLocationUpdate(onUpdate);
    return unsub;
  }, [onUpdate]);
}

export function useVisitUpdates(
  visitId: string,
  onUpdate: (data: any) => void,
) {
  useEffect(() => {
    if (!visitId) return;
    websocketService.joinVisit(visitId);
    const unsub = websocketService.onVisitUpdate(visitId, onUpdate);
    return () => {
      websocketService.leaveVisit(visitId);
      unsub();
    };
  }, [visitId, onUpdate]);
}
