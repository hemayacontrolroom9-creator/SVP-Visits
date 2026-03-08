// ── Enums ──────────────────────────────────────────────────────────────────

export enum UserRole {
  ADMIN = 'admin',
  MANAGER = 'manager',
  SUPERVISOR = 'supervisor',
  VIEWER = 'viewer',
}

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

export enum AlertSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical',
}

export enum AlertStatus {
  ACTIVE = 'active',
  ACKNOWLEDGED = 'acknowledged',
  RESOLVED = 'resolved',
}

export enum AlertType {
  MISSED_VISIT = 'missed_visit',
  LATE_CHECK_IN = 'late_check_in',
  OVERDUE_CHECK_OUT = 'overdue_check_out',
  GPS_OUTSIDE_GEOFENCE = 'gps_outside_geofence',
  CHECKLIST_INCOMPLETE = 'checklist_incomplete',
}

// ── Models ─────────────────────────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  fullName: string;
  role: UserRole;
  phone?: string;
  avatarUrl?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Site {
  id: string;
  name: string;
  code: string;
  address: string;
  city: string;
  latitude: number;
  longitude: number;
  geofenceRadius: number;
  requiresQrVerification: boolean;
  requiresGpsVerification: boolean;
  isActive: boolean;
  contactName?: string;
  contactPhone?: string;
  qrCodeUrl?: string;
}

export interface GpsPoint {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
}

export interface Visit {
  id: string;
  site: Site;
  supervisor: User;
  scheduledAt: string;
  checkInAt?: string;
  checkOutAt?: string;
  status: VisitStatus;
  checkInLatitude?: number;
  checkInLongitude?: number;
  checkInDistanceFromSite?: number;
  isGpsVerified: boolean;
  isQrVerified: boolean;
  forceCheckIn: boolean;
  gpsTrack?: GpsPoint[];
  notes?: string;
  durationMinutes?: number;
  createdAt: string;
  updatedAt: string;
}

export interface Alert {
  id: string;
  type: AlertType;
  severity: AlertSeverity;
  status: AlertStatus;
  message: string;
  visit?: Visit;
  site?: Site;
  supervisor?: User;
  resolution?: string;
  resolvedAt?: string;
  createdAt: string;
}

export interface ChecklistTemplate {
  id: string;
  name: string;
  description?: string;
  site?: Site;
  isActive: boolean;
  items: ChecklistItem[];
}

export interface ChecklistItem {
  id: string;
  label: string;
  type: 'yes_no' | 'text' | 'number' | 'rating' | 'photo' | 'signature';
  required: boolean;
  order: number;
  options?: string[];
}

// ── API Response Types ─────────────────────────────────────────────────────

export interface ApiResponse<T> {
  statusCode: number;
  message: string;
  data: T;
  timestamp: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  user: User;
}

// ── Dashboard Stats ────────────────────────────────────────────────────────

export interface DashboardStats {
  todayVisits: number;
  completedVisits: number;
  missedVisits: number;
  inProgressVisits: number;
  activeAlerts: number;
  complianceRate: number;
  activeSupervisors: number;
  activeSites: number;
}

// ── Map Types ──────────────────────────────────────────────────────────────

export interface SupervisorLocation {
  supervisorId: string;
  supervisorName: string;
  latitude: number;
  longitude: number;
  visitId?: string;
  siteName?: string;
  updatedAt: string;
}
