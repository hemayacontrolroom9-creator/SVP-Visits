import { Entity, Column, OneToMany, ManyToMany, JoinTable, Index, BeforeInsert, BeforeUpdate } from 'typeorm';
import { Exclude } from 'class-transformer';
import { BaseEntity } from '../../common/entities/base.entity';
import { UserRole } from '../../common/decorators/roles.decorator';
import { Visit } from '../../visits/entities/visit.entity';
import { Site } from '../../sites/entities/site.entity';

@Entity('users')
@Index(['email'], { unique: true })
@Index(['role'])
export class User extends BaseEntity {
  @Column({ name: 'first_name', length: 100 })
  firstName: string;

  @Column({ name: 'last_name', length: 100 })
  lastName: string;

  @Column({ unique: true, length: 255 })
  email: string;

  @Column({ select: false })
  @Exclude()
  password: string;

  @Column({ type: 'enum', enum: UserRole, default: UserRole.SUPERVISOR })
  role: UserRole;

  @Column({ length: 20, nullable: true })
  phone: string;

  @Column({ name: 'avatar_url', type: 'text', nullable: true })
  avatarUrl: string;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'last_login_at', type: 'timestamptz', nullable: true })
  lastLoginAt: Date;

  @Column({ name: 'last_login_ip', length: 45, nullable: true })
  lastLoginIp: string;

  @Column({ name: 'fcm_token', type: 'text', nullable: true })
  fcmToken: string;

  @Column({ name: 'password_reset_token', type: 'text', nullable: true, select: false })
  @Exclude()
  passwordResetToken: string;

  @Column({ name: 'password_reset_expiry', type: 'timestamptz', nullable: true, select: false })
  @Exclude()
  passwordResetExpiry: Date;

  @Column({ type: 'jsonb', nullable: true })
  preferences: Record<string, any>;

  @Column({ name: 'employee_id', length: 50, nullable: true, unique: true })
  employeeId: string;

  @Column({ length: 100, nullable: true })
  department: string;

  @OneToMany(() => Visit, (visit) => visit.supervisor)
  visits: Visit[];

  @ManyToMany(() => Site, (site) => site.assignedSupervisors)
  @JoinTable({
    name: 'user_sites',
    joinColumn: { name: 'user_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'site_id', referencedColumnName: 'id' },
  })
  managedSites: Site[];

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  @BeforeInsert()
  @BeforeUpdate()
  normalizeEmail() {
    if (this.email) this.email = this.email.toLowerCase().trim();
  }
}
