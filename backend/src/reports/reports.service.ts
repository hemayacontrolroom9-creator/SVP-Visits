import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Visit, VisitStatus } from '../visits/entities/visit.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';
import { Alert, AlertStatus } from '../alerts/entities/alert.entity';
import { UserRole } from '../common/decorators/roles.decorator';

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Visit) private visitsRepo: Repository<Visit>,
    @InjectRepository(Site) private sitesRepo: Repository<Site>,
    @InjectRepository(User) private usersRepo: Repository<User>,
    @InjectRepository(Alert) private alertsRepo: Repository<Alert>,
  ) {}

  async getDashboardStats(currentUser: any) {
    const today = new Date();
    const startOfToday = new Date(today.setHours(0, 0, 0, 0));
    const endOfToday = new Date(today.setHours(23, 59, 59, 999));

    const baseWhere = currentUser.role === UserRole.SUPERVISOR
      ? { supervisorId: currentUser.id }
      : {};

    const [
      totalVisits,
      todayVisits,
      completedToday,
      missedToday,
      inProgressVisits,
      activeAlerts,
      totalSites,
      activeSupervisors,
    ] = await Promise.all([
      this.visitsRepo.count({ where: baseWhere }),
      this.visitsRepo.count({ where: { ...baseWhere, scheduledAt: Between(startOfToday, endOfToday) } }),
      this.visitsRepo.count({ where: { ...baseWhere, status: VisitStatus.COMPLETED, completedAt: Between(startOfToday, endOfToday) } }),
      this.visitsRepo.count({ where: { ...baseWhere, status: VisitStatus.MISSED, scheduledAt: Between(startOfToday, endOfToday) } }),
      this.visitsRepo.count({ where: { ...baseWhere, status: VisitStatus.IN_PROGRESS } }),
      this.alertsRepo.count({ where: { status: AlertStatus.ACTIVE } }),
      this.sitesRepo.count(),
      this.usersRepo.count({ where: { role: UserRole.SUPERVISOR, isActive: true } }),
    ]);

    const completionRate = todayVisits > 0 ? Math.round((completedToday / todayVisits) * 100) : 0;

    return {
      visits: { total: totalVisits, today: todayVisits, completedToday, missedToday, inProgress: inProgressVisits, completionRate },
      alerts: { active: activeAlerts },
      sites: { total: totalSites },
      supervisors: { active: activeSupervisors },
    };
  }

  async getVisitSummary(startDate: string, endDate: string, currentUser: any) {
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const queryBuilder = this.visitsRepo.createQueryBuilder('visit')
      .select([
        'DATE(visit.scheduledAt) as date',
        'COUNT(*) as total',
        `SUM(CASE WHEN visit.status = 'completed' THEN 1 ELSE 0 END) as completed`,
        `SUM(CASE WHEN visit.status = 'missed' THEN 1 ELSE 0 END) as missed`,
        `SUM(CASE WHEN visit.status = 'in_progress' THEN 1 ELSE 0 END) as in_progress`,
        'AVG(visit.durationMinutes) as avg_duration',
      ])
      .where('visit.scheduledAt BETWEEN :start AND :end', { start, end })
      .groupBy('DATE(visit.scheduledAt)')
      .orderBy('date', 'ASC');

    if (currentUser.role === UserRole.SUPERVISOR) {
      queryBuilder.andWhere('visit.supervisorId = :userId', { userId: currentUser.id });
    }

    return queryBuilder.getRawMany();
  }

  async getVisitsBySupervisor(startDate: string, endDate: string) {
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    return this.visitsRepo.createQueryBuilder('visit')
      .select([
        'user.id as supervisor_id',
        'user.firstName as first_name',
        'user.lastName as last_name',
        'COUNT(*) as total',
        `SUM(CASE WHEN visit.status = 'completed' THEN 1 ELSE 0 END) as completed`,
        `SUM(CASE WHEN visit.status = 'missed' THEN 1 ELSE 0 END) as missed`,
        'AVG(visit.durationMinutes) as avg_duration',
        'AVG(visit.checkInDistanceMeters) as avg_check_in_distance',
      ])
      .leftJoin('visit.supervisor', 'user')
      .where('visit.scheduledAt BETWEEN :start AND :end', { start, end })
      .groupBy('user.id, user.firstName, user.lastName')
      .orderBy('completed', 'DESC')
      .getRawMany();
  }

  async getVisitsBySite(startDate: string, endDate: string) {
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    return this.visitsRepo.createQueryBuilder('visit')
      .select([
        'site.id as site_id',
        'site.name as site_name',
        'site.city as city',
        'COUNT(*) as total',
        `SUM(CASE WHEN visit.status = 'completed' THEN 1 ELSE 0 END) as completed`,
        `SUM(CASE WHEN visit.status = 'missed' THEN 1 ELSE 0 END) as missed`,
      ])
      .leftJoin('visit.site', 'site')
      .where('visit.scheduledAt BETWEEN :start AND :end', { start, end })
      .groupBy('site.id, site.name, site.city')
      .orderBy('total', 'DESC')
      .getRawMany();
  }

  async getComplianceReport(startDate: string, endDate: string) {
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    const results = await this.visitsRepo.createQueryBuilder('visit')
      .select([
        'COUNT(*) as total_visits',
        `SUM(CASE WHEN visit.status = 'completed' THEN 1 ELSE 0 END) as completed`,
        `SUM(CASE WHEN visit.isGpsVerified = true THEN 1 ELSE 0 END) as gps_verified`,
        `SUM(CASE WHEN visit.isQrVerified = true THEN 1 ELSE 0 END) as qr_verified`,
        `SUM(CASE WHEN visit.status = 'missed' THEN 1 ELSE 0 END) as missed`,
        'AVG(visit.durationMinutes) as avg_duration',
      ])
      .where('visit.scheduledAt BETWEEN :start AND :end', { start, end })
      .getRawOne();

    const total = parseInt(results.total_visits) || 0;
    return {
      ...results,
      completion_rate: total > 0 ? Math.round((results.completed / total) * 100) : 0,
      gps_verification_rate: total > 0 ? Math.round((results.gps_verified / total) * 100) : 0,
      qr_verification_rate: total > 0 ? Math.round((results.qr_verified / total) * 100) : 0,
    };
  }

  async getActivityHeatmap(startDate: string, endDate: string) {
    const start = new Date(startDate || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000));
    const end = new Date(endDate || new Date());

    return this.visitsRepo.createQueryBuilder('visit')
      .select([
        'EXTRACT(DOW FROM visit.scheduledAt) as day_of_week',
        'EXTRACT(HOUR FROM visit.scheduledAt) as hour_of_day',
        'COUNT(*) as count',
      ])
      .where('visit.scheduledAt BETWEEN :start AND :end', { start, end })
      .groupBy('day_of_week, hour_of_day')
      .orderBy('day_of_week', 'ASC')
      .getRawMany();
  }
}
