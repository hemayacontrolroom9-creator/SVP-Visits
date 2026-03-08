import {
  Injectable, NotFoundException, BadRequestException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { startOfDay, endOfDay } from 'date-fns';

import { Visit, VisitStatus, VerificationMethod } from './entities/visit.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FilterVisitsDto } from './dto/filter-visits.dto';
import { UpdateGpsTrackDto } from './dto/update-gps-track.dto';
import { UserRole } from '../common/decorators/roles.decorator';
import { paginate } from '../common/dto/pagination.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class VisitsService {
  private readonly logger = new Logger(VisitsService.name);

  constructor(
    @InjectRepository(Visit) private visitsRepository: Repository<Visit>,
    @InjectRepository(Site) private sitesRepository: Repository<Site>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private auditService: AuditService,
    private eventEmitter: EventEmitter2,
  ) {}

  async findAll(filterDto: FilterVisitsDto, currentUser: User) {
    const { skip, limit, sortBy, sortOrder, status, siteId, supervisorId, startDate, endDate } = filterDto;

    const queryBuilder = this.visitsRepository.createQueryBuilder('visit')
      .leftJoinAndSelect('visit.supervisor', 'supervisor')
      .leftJoinAndSelect('visit.site', 'site');

    if (currentUser.role === UserRole.SUPERVISOR) {
      queryBuilder.andWhere('visit.supervisorId = :userId', { userId: currentUser.id });
    }

    if (status) queryBuilder.andWhere('visit.status = :status', { status });
    if (siteId) queryBuilder.andWhere('visit.siteId = :siteId', { siteId });
    if (supervisorId && currentUser.role !== UserRole.SUPERVISOR) {
      queryBuilder.andWhere('visit.supervisorId = :supervisorId', { supervisorId });
    }
    if (startDate) queryBuilder.andWhere('visit.scheduledAt >= :startDate', { startDate });
    if (endDate) queryBuilder.andWhere('visit.scheduledAt <= :endDate', { endDate });

    queryBuilder.orderBy(`visit.${sortBy || 'scheduledAt'}`, sortOrder || 'DESC').skip(skip).take(limit);
    const [visits, total] = await queryBuilder.getManyAndCount();
    return paginate(visits, total, filterDto);
  }

  async getSupervisorVisits(supervisorId: string, filterDto: FilterVisitsDto) {
    return this.findAll({ ...filterDto, supervisorId } as any, { id: supervisorId, role: UserRole.SUPERVISOR } as any);
  }

  async getTodayVisits(currentUser: User) {
    const today = new Date();
    const queryBuilder = this.visitsRepository.createQueryBuilder('visit')
      .leftJoinAndSelect('visit.supervisor', 'supervisor')
      .leftJoinAndSelect('visit.site', 'site')
      .where('visit.scheduledAt BETWEEN :start AND :end', {
        start: startOfDay(today),
        end: endOfDay(today),
      });

    if (currentUser.role === UserRole.SUPERVISOR) {
      queryBuilder.andWhere('visit.supervisorId = :userId', { userId: currentUser.id });
    }

    return queryBuilder.orderBy('visit.scheduledAt', 'ASC').getMany();
  }

  async getActiveVisits() {
    return this.visitsRepository.find({
      where: { status: VisitStatus.IN_PROGRESS },
      relations: ['supervisor', 'site'],
    });
  }

  async findOne(id: string): Promise<Visit> {
    const visit = await this.visitsRepository.findOne({
      where: { id },
      relations: ['supervisor', 'site', 'checklistResponses'],
    });
    if (!visit) throw new NotFoundException(`Visit #${id} not found`);
    return visit;
  }

  async create(createVisitDto: CreateVisitDto, createdBy: string): Promise<Visit> {
    const site = await this.sitesRepository.findOne({ where: { id: createVisitDto.siteId } });
    if (!site) throw new NotFoundException('Site not found');

    const supervisor = await this.usersRepository.findOne({
      where: { id: createVisitDto.supervisorId },
    });
    if (!supervisor) throw new NotFoundException('Supervisor not found');

    const visit = this.visitsRepository.create({ ...createVisitDto, createdBy });
    const saved = await this.visitsRepository.save(visit);

    this.eventEmitter.emit('visit.scheduled', { visit: saved, site, supervisor });

    await this.auditService.log({
      action: 'visit.scheduled',
      entityType: 'Visit',
      entityId: saved.id,
      userId: createdBy,
      newValues: { siteId: saved.siteId, supervisorId: saved.supervisorId, scheduledAt: saved.scheduledAt },
    });

    return this.findOne(saved.id);
  }

  async checkIn(visitId: string, checkInDto: CheckInDto, userId: string): Promise<Visit> {
    const visit = await this.findOne(visitId);

    if (visit.supervisorId !== userId) {
      throw new ForbiddenException('You can only check in to your own visits');
    }

    if (visit.status !== VisitStatus.SCHEDULED) {
      throw new BadRequestException(`Cannot check in to a ${visit.status} visit`);
    }

    const site = await this.sitesRepository.findOne({ where: { id: visit.siteId } });

    // GPS Verification
    let isGpsVerified = false;
    let distanceMeters = 0;

    if (checkInDto.latitude && checkInDto.longitude) {
      distanceMeters = this.calculateDistance(
        checkInDto.latitude, checkInDto.longitude,
        Number(site.latitude), Number(site.longitude),
      );
      isGpsVerified = distanceMeters <= site.geofenceRadius;

      if (!isGpsVerified && !checkInDto.forceCheckIn) {
        throw new BadRequestException(
          `You are ${Math.round(distanceMeters)}m from the site. Maximum allowed: ${site.geofenceRadius}m. Use forceCheckIn=true to override.`,
        );
      }
    }

    // QR Code Verification
    let isQrVerified = false;
    if (checkInDto.qrCode) {
      try {
        const qrData = JSON.parse(checkInDto.qrCode);
        isQrVerified = qrData.siteId === visit.siteId && qrData.secret === site.qrCodeSecret;
      } catch {
        isQrVerified = false;
      }
    }

    let verificationMethod = VerificationMethod.MANUAL;
    if (isGpsVerified && isQrVerified) verificationMethod = VerificationMethod.BOTH;
    else if (isGpsVerified) verificationMethod = VerificationMethod.GPS;
    else if (isQrVerified) verificationMethod = VerificationMethod.QR_CODE;

    await this.visitsRepository.update(visitId, {
      status: VisitStatus.IN_PROGRESS,
      startedAt: new Date(),
      checkInLatitude: checkInDto.latitude,
      checkInLongitude: checkInDto.longitude,
      checkInDistanceMeters: Math.round(distanceMeters),
      isGpsVerified,
      isQrVerified,
      verificationMethod,
      gpsTrack: checkInDto.latitude ? [{ lat: checkInDto.latitude, lng: checkInDto.longitude, timestamp: new Date().toISOString() }] : [],
    });

    const updated = await this.findOne(visitId);
    this.eventEmitter.emit('visit.checked_in', { visit: updated });

    await this.auditService.log({
      action: 'visit.checked_in',
      entityType: 'Visit',
      entityId: visitId,
      userId,
      metadata: { isGpsVerified, isQrVerified, distanceMeters: Math.round(distanceMeters) },
    });

    return updated;
  }

  async checkOut(visitId: string, checkOutDto: CheckOutDto, userId: string): Promise<Visit> {
    const visit = await this.findOne(visitId);

    if (visit.supervisorId !== userId) {
      throw new ForbiddenException('You can only check out from your own visits');
    }

    if (visit.status !== VisitStatus.IN_PROGRESS) {
      throw new BadRequestException('Visit is not in progress');
    }

    const completedAt = new Date();
    const durationMinutes = visit.startedAt
      ? Math.round((completedAt.getTime() - visit.startedAt.getTime()) / 60000)
      : 0;

    await this.visitsRepository.update(visitId, {
      status: VisitStatus.COMPLETED,
      completedAt,
      checkOutLatitude: checkOutDto.latitude,
      checkOutLongitude: checkOutDto.longitude,
      durationMinutes,
      notes: checkOutDto.notes,
    });

    const updated = await this.findOne(visitId);
    this.eventEmitter.emit('visit.completed', { visit: updated });

    await this.auditService.log({
      action: 'visit.completed',
      entityType: 'Visit',
      entityId: visitId,
      userId,
      metadata: { durationMinutes, completedAt },
    });

    return updated;
  }

  async updateGpsTrack(visitId: string, dto: UpdateGpsTrackDto, userId: string): Promise<void> {
    const visit = await this.visitsRepository.findOne({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.supervisorId !== userId) throw new ForbiddenException();
    if (visit.status !== VisitStatus.IN_PROGRESS) return;

    const currentTrack = visit.gpsTrack || [];
    const newTrack = [...currentTrack, ...dto.points];

    await this.visitsRepository.update(visitId, { gpsTrack: newTrack });
    this.eventEmitter.emit('visit.location_updated', { visitId, userId, point: dto.points[dto.points.length - 1] });
  }

  async update(id: string, updateVisitDto: UpdateVisitDto, userId: string): Promise<Visit> {
    const visit = await this.findOne(id);
    await this.visitsRepository.update(id, updateVisitDto);
    await this.auditService.log({ action: 'visit.updated', entityType: 'Visit', entityId: id, userId });
    return this.findOne(id);
  }

  async cancel(id: string, userId: string): Promise<void> {
    const visit = await this.findOne(id);
    if ([VisitStatus.COMPLETED].includes(visit.status)) {
      throw new BadRequestException('Cannot cancel a completed visit');
    }
    await this.visitsRepository.update(id, { status: VisitStatus.CANCELLED });
    await this.auditService.log({ action: 'visit.cancelled', entityType: 'Visit', entityId: id, userId });
  }

  private calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
