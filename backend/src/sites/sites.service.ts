import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as QRCode from 'qrcode';
import { v4 as uuidv4 } from 'uuid';

import { Site, SiteStatus } from './entities/site.entity';
import { User } from '../users/entities/user.entity';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class SitesService {
  private readonly logger = new Logger(SitesService.name);

  constructor(
    @InjectRepository(Site) private sitesRepository: Repository<Site>,
    @InjectRepository(User) private usersRepository: Repository<User>,
    private auditService: AuditService,
  ) {}

  async findAll(paginationDto: PaginationDto, currentUser: User) {
    const { skip, limit, search, sortBy, sortOrder } = paginationDto;

    const queryBuilder = this.sitesRepository.createQueryBuilder('site')
      .leftJoinAndSelect('site.assignedSupervisors', 'supervisors');

    if (currentUser.role === UserRole.SUPERVISOR) {
      queryBuilder.innerJoin('site.assignedSupervisors', 'assignedUser', 'assignedUser.id = :userId', {
        userId: currentUser.id,
      });
    }

    if (search) {
      queryBuilder.andWhere('(site.name ILIKE :search OR site.siteCode ILIKE :search OR site.city ILIKE :search)', {
        search: `%${search}%`,
      });
    }

    queryBuilder
      .orderBy(`site.${sortBy || 'createdAt'}`, sortOrder || 'DESC')
      .skip(skip)
      .take(limit);

    const [sites, total] = await queryBuilder.getManyAndCount();
    return paginate(sites, total, paginationDto);
  }

  async findOne(id: string): Promise<Site> {
    const site = await this.sitesRepository.findOne({
      where: { id },
      relations: ['assignedSupervisors', 'visits'],
    });
    if (!site) throw new NotFoundException(`Site #${id} not found`);
    return site;
  }

  async getMapSites(currentUser: User) {
    const queryBuilder = this.sitesRepository.createQueryBuilder('site')
      .select(['site.id', 'site.name', 'site.siteCode', 'site.latitude', 'site.longitude', 'site.status', 'site.geofenceRadius']);

    if (currentUser.role === UserRole.SUPERVISOR) {
      queryBuilder.innerJoin('site.assignedSupervisors', 'assignedUser', 'assignedUser.id = :userId', {
        userId: currentUser.id,
      });
    }

    return queryBuilder.where('site.status = :status', { status: SiteStatus.ACTIVE }).getMany();
  }

  async create(createSiteDto: CreateSiteDto, createdBy: string): Promise<Site> {
    const qrSecret = uuidv4();
    const site = this.sitesRepository.create({
      ...createSiteDto,
      qrCodeSecret: qrSecret,
    });
    const saved = await this.sitesRepository.save(site);

    await this.auditService.log({
      action: 'site.created',
      entityType: 'Site',
      entityId: saved.id,
      userId: createdBy,
      newValues: { name: saved.name, siteCode: saved.siteCode },
    });

    return saved;
  }

  async update(id: string, updateSiteDto: UpdateSiteDto, userId: string): Promise<Site> {
    const site = await this.findOne(id);
    await this.sitesRepository.update(id, updateSiteDto);
    const updated = await this.findOne(id);

    await this.auditService.log({
      action: 'site.updated',
      entityType: 'Site',
      entityId: id,
      userId,
      oldValues: site,
      newValues: updateSiteDto,
    });

    return updated;
  }

  async generateQrCode(siteId: string): Promise<{ qrCode: string; qrDataUrl: string }> {
    const site = await this.sitesRepository.findOne({
      where: { id: siteId },
      select: ['id', 'qrCodeSecret', 'siteCode', 'name'],
    });
    if (!site) throw new NotFoundException('Site not found');

    const qrData = JSON.stringify({
      siteId: site.id,
      siteCode: site.siteCode,
      secret: site.qrCodeSecret,
      timestamp: Date.now(),
    });

    const qrDataUrl = await QRCode.toDataURL(qrData, {
      errorCorrectionLevel: 'H',
      type: 'image/png',
      width: 300,
    });

    await this.sitesRepository.update(siteId, { qrCode: qrData });
    return { qrCode: qrData, qrDataUrl };
  }

  async assignSupervisor(siteId: string, supervisorId: string, userId: string): Promise<Site> {
    const site = await this.findOne(siteId);
    const supervisor = await this.usersRepository.findOne({ where: { id: supervisorId } });
    if (!supervisor) throw new NotFoundException('Supervisor not found');

    if (!site.assignedSupervisors) site.assignedSupervisors = [];
    const isAlreadyAssigned = site.assignedSupervisors.some((s) => s.id === supervisorId);
    if (!isAlreadyAssigned) {
      site.assignedSupervisors.push(supervisor);
      await this.sitesRepository.save(site);
    }

    return this.findOne(siteId);
  }

  async remove(id: string, userId: string): Promise<void> {
    const site = await this.findOne(id);
    await this.sitesRepository.softDelete(id);
    await this.auditService.log({
      action: 'site.deleted',
      entityType: 'Site',
      entityId: id,
      userId,
      oldValues: { name: site.name },
    });
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371000; // Earth radius in meters
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat / 2) ** 2 +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }
}
