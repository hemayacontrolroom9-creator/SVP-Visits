import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Alert, AlertType, AlertSeverity, AlertStatus } from './entities/alert.entity';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

@Injectable()
export class AlertsService {
  private readonly logger = new Logger(AlertsService.name);

  constructor(@InjectRepository(Alert) private alertsRepository: Repository<Alert>) {}

  async create(data: {
    type: AlertType;
    severity: AlertSeverity;
    title: string;
    message: string;
    userId?: string;
    entityType?: string;
    entityId?: string;
    metadata?: Record<string, any>;
  }): Promise<Alert> {
    const alert = this.alertsRepository.create(data);
    return this.alertsRepository.save(alert);
  }

  async findAll(paginationDto: PaginationDto, currentUser: any) {
    const { skip, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.alertsRepository.createQueryBuilder('alert')
      .leftJoinAndSelect('alert.user', 'user');

    if (currentUser.role === 'supervisor') {
      queryBuilder.andWhere('alert.userId = :userId', { userId: currentUser.id });
    }

    queryBuilder.orderBy(`alert.${sortBy || 'createdAt'}`, sortOrder || 'DESC').skip(skip).take(limit);
    const [alerts, total] = await queryBuilder.getManyAndCount();
    return paginate(alerts, total, paginationDto);
  }

  async acknowledge(alertId: string, userId: string): Promise<Alert> {
    await this.alertsRepository.update(alertId, {
      status: AlertStatus.ACKNOWLEDGED,
      acknowledgedAt: new Date(),
      acknowledgedBy: userId,
    });
    return this.alertsRepository.findOne({ where: { id: alertId } });
  }

  async resolve(alertId: string): Promise<Alert> {
    await this.alertsRepository.update(alertId, {
      status: AlertStatus.RESOLVED,
      resolvedAt: new Date(),
    });
    return this.alertsRepository.findOne({ where: { id: alertId } });
  }

  async getActiveCount(): Promise<number> {
    return this.alertsRepository.count({ where: { status: AlertStatus.ACTIVE } });
  }
}
