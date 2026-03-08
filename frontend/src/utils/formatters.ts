import { formatDistanceToNow, format, parseISO, differenceInMinutes } from 'date-fns';
import { VisitStatus } from '../types';

export const formatDate = (date: string | Date, pattern = 'MMM dd, yyyy'): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, pattern);
};

export const formatDateTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'MMM dd, yyyy HH:mm');
};

export const formatTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return format(d, 'hh:mm a');
};

export const formatRelativeTime = (date: string | Date): string => {
  const d = typeof date === 'string' ? parseISO(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
};

export const formatDuration = (minutes: number): string => {
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
};

export const formatVisitDuration = (checkIn: string, checkOut?: string): string => {
  if (!checkOut) return 'In progress';
  const minutes = differenceInMinutes(parseISO(checkOut), parseISO(checkIn));
  return formatDuration(minutes);
};

export const formatDistance = (meters: number): string => {
  if (meters < 1000) return `${Math.round(meters)}m`;
  return `${(meters / 1000).toFixed(1)}km`;
};

export const formatCoordinate = (lat: number, lng: number): string => {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/(\+\d{3})(\d{2})(\d{3})(\d{4})/, '$1 $2 $3 $4');
};

export const getStatusColor = (status: VisitStatus): string => {
  const map: Record<VisitStatus, string> = {
    [VisitStatus.COMPLETED]: 'success',
    [VisitStatus.IN_PROGRESS]: 'warning',
    [VisitStatus.SCHEDULED]: 'info',
    [VisitStatus.MISSED]: 'error',
    [VisitStatus.CANCELLED]: 'default',
  };
  return map[status] || 'default';
};

export const getStatusLabel = (status: VisitStatus): string => {
  const map: Record<VisitStatus, string> = {
    [VisitStatus.COMPLETED]: 'Completed',
    [VisitStatus.IN_PROGRESS]: 'In Progress',
    [VisitStatus.SCHEDULED]: 'Scheduled',
    [VisitStatus.MISSED]: 'Missed',
    [VisitStatus.CANCELLED]: 'Cancelled',
  };
  return map[status] || status;
};

export const truncate = (text: string, maxLength = 50): string => {
  if (text.length <= maxLength) return text;
  return `${text.slice(0, maxLength)}...`;
};

export const initials = (firstName: string, lastName: string): string => {
  return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
};
