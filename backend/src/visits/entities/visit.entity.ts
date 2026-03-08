import { Entity, Column, ManyToOne, OneToMany, JoinColumn, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Site } from '../../sites/entities/site.entity';
import { ChecklistResponse } from '../../checklists/entities/checklist-response.entity';

export enum VisitStatus {
  SCHEDULED = 'scheduled',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  MISSED = 'missed',
  CANCELLED = 'cancelled',
}

export enum VerificationMethod {
  GPS = 'gps',
  QR_CODE = 'qr_code',
  BOTH = 'both',
  MANUAL = 'manual',
}

@Entity('visits')
@Index(['status'])
@Index(['scheduledAt'])
@Index(['supervisorId'])
@Index(['siteId'])
export class Visit extends BaseEntity {
  @Column({ name: 'supervisor_id' })
  supervisorId: string;

  @ManyToOne(() => User, (user) => user.visits, { eager: false })
  @JoinColumn({ name: 'supervisor_id' })
  supervisor: User;

  @Column({ name: 'site_id' })
  siteId: string;

  @ManyToOne(() => Site, (site) => site.visits, { eager: false })
  @JoinColumn({ name: 'site_id' })
  site: Site;

  @Column({ type: 'enum', enum: VisitStatus, default: VisitStatus.SCHEDULED })
  status: VisitStatus;

  @Column({ name: 'scheduled_at', type: 'timestamptz' })
  scheduledAt: Date;

  @Column({ name: 'started_at', type: 'timestamptz', nullable: true })
  startedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamptz', nullable: true })
  completedAt: Date;

  @Column({ name: 'check_in_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  checkInLatitude: number;

  @Column({ name: 'check_in_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  checkInLongitude: number;

  @Column({ name: 'check_out_latitude', type: 'decimal', precision: 10, scale: 8, nullable: true })
  checkOutLatitude: number;

  @Column({ name: 'check_out_longitude', type: 'decimal', precision: 11, scale: 8, nullable: true })
  checkOutLongitude: number;

  @Column({ name: 'check_in_distance_meters', type: 'integer', nullable: true })
  checkInDistanceMeters: number;

  @Column({ name: 'is_gps_verified', default: false })
  isGpsVerified: boolean;

  @Column({ name: 'is_qr_verified', default: false })
  isQrVerified: boolean;

  @Column({ type: 'enum', enum: VerificationMethod, nullable: true })
  verificationMethod: VerificationMethod;

  @Column({ name: 'gps_track', type: 'jsonb', nullable: true })
  gpsTrack: Array<{ lat: number; lng: number; timestamp: string; accuracy?: number }>;

  @Column({ name: 'duration_minutes', type: 'integer', nullable: true })
  durationMinutes: number;

  @Column({ name: 'notes', type: 'text', nullable: true })
  notes: string;

  @Column({ name: 'photo_urls', type: 'simple-array', nullable: true })
  photoUrls: string[];

  @Column({ name: 'signature_url', type: 'text', nullable: true })
  signatureUrl: string;

  @Column({ name: 'created_by', nullable: true })
  createdBy: string;

  @Column({ name: 'is_overtime', default: false })
  isOvertime: boolean;

  @Column({ name: 'visit_number', type: 'integer', generated: 'increment' })
  visitNumber: number;

  @OneToMany(() => ChecklistResponse, (response) => response.visit, { cascade: true })
  checklistResponses: ChecklistResponse[];
}
