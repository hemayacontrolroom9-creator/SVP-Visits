import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AuditLog } from './entities/audit-log.entity';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';

export interface CreateAuditLogDto {
  action: string;
  entityType: string;
  entityId?: string;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  ipAddress?: string;
  oldValues?: Record<string, any>;
  newValues?: Record<string, any>;
  metadata?: Record<string, any>;
  isSuccess?: boolean;
  errorMessage?: string;
}

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(@InjectRepository(AuditLog) private auditRepository: Repository<AuditLog>) {}

  async log(dto: CreateAuditLogDto): Promise<void> {
    try {
      const log = this.auditRepository.create({
        ...dto,
        isSuccess: dto.isSuccess !== undefined ? dto.isSuccess : true,
      });
      await this.auditRepository.save(log);
    } catch (err) {
      this.logger.error('Failed to write audit log', err);
    }
  }

  async findAll(paginationDto: PaginationDto, filters?: {
    userId?: string;
    entityType?: string;
    entityId?: string;
    action?: string;
    startDate?: Date;
    endDate?: Date;
  }) {
    const { skip, limit, sortBy, sortOrder } = paginationDto;
    const queryBuilder = this.auditRepository.createQueryBuilder('log');

    if (filters?.userId) queryBuilder.andWhere('log.userId = :userId', { userId: filters.userId });
    if (filters?.entityType) queryBuilder.andWhere('log.entityType = :entityType', { entityType: filters.entityType });
    if (filters?.entityId) queryBuilder.andWhere('log.entityId = :entityId', { entityId: filters.entityId });
    if (filters?.action) queryBuilder.andWhere('log.action ILIKE :action', { action: `%${filters.action}%` });
    if (filters?.startDate) queryBuilder.andWhere('log.createdAt >= :startDate', { startDate: filters.startDate });
    if (filters?.endDate) queryBuilder.andWhere('log.createdAt <= :endDate', { endDate: filters.endDate });

    queryBuilder.orderBy(`log.${sortBy || 'createdAt'}`, sortOrder || 'DESC').skip(skip).take(limit);
    const [logs, total] = await queryBuilder.getManyAndCount();
    return paginate(logs, total, paginationDto);
  }
}
