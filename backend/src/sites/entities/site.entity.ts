import { Entity, Column, OneToMany, ManyToMany, Index } from 'typeorm';
import { BaseEntity } from '../../common/entities/base.entity';
import { User } from '../../users/entities/user.entity';
import { Visit } from '../../visits/entities/visit.entity';

export enum SiteStatus {
  ACTIVE = 'active',
  INACTIVE = 'inactive',
  MAINTENANCE = 'maintenance',
}

@Entity('sites')
@Index(['status'])
@Index(['location'], { spatial: true })
export class Site extends BaseEntity {
  @Column({ length: 200 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ name: 'site_code', length: 50, unique: true })
  siteCode: string;

  @Column({ type: 'text' })
  address: string;

  @Column({ length: 100, nullable: true })
  city: string;

  @Column({ length: 100, nullable: true })
  country: string;

  @Column({ type: 'decimal', precision: 10, scale: 8 })
  latitude: number;

  @Column({ type: 'decimal', precision: 11, scale: 8 })
  longitude: number;

  @Column({ name: 'geofence_radius', type: 'integer', default: 200 })
  geofenceRadius: number;

  @Column({ type: 'enum', enum: SiteStatus, default: SiteStatus.ACTIVE })
  status: SiteStatus;

  @Column({ name: 'qr_code', type: 'text', nullable: true })
  qrCode: string;

  @Column({ name: 'qr_code_secret', type: 'text', nullable: true, select: false })
  qrCodeSecret: string;

  @Column({ name: 'contact_name', length: 100, nullable: true })
  contactName: string;

  @Column({ name: 'contact_phone', length: 20, nullable: true })
  contactPhone: string;

  @Column({ name: 'contact_email', length: 255, nullable: true })
  contactEmail: string;

  @Column({ name: 'visit_frequency_days', type: 'integer', default: 7 })
  visitFrequencyDays: number;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'image_urls', type: 'simple-array', nullable: true })
  imageUrls: string[];

  @OneToMany(() => Visit, (visit) => visit.site)
  visits: Visit[];

  @ManyToMany(() => User, (user) => user.managedSites)
  assignedSupervisors: User[];
}
