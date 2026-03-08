import {
  Injectable, NotFoundException, ConflictException,
  ForbiddenException, Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { ConfigService } from '@nestjs/config';

import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { PaginationDto, paginate } from '../common/dto/pagination.dto';
import { UserRole } from '../common/decorators/roles.decorator';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async findAll(paginationDto: PaginationDto) {
    const { skip, limit, search, sortBy, sortOrder } = paginationDto;
    const whereClause = search
      ? [
          { firstName: ILike(`%${search}%`) },
          { lastName: ILike(`%${search}%`) },
          { email: ILike(`%${search}%`) },
        ]
      : undefined;

    const [users, total] = await this.usersRepository.findAndCount({
      where: whereClause,
      skip,
      take: limit,
      order: { [sortBy || 'createdAt']: sortOrder || 'DESC' },
    });

    return paginate(users, total, paginationDto);
  }

  async findOne(id: string): Promise<User> {
    const user = await this.usersRepository.findOne({
      where: { id },
      relations: ['managedSites'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email.toLowerCase() } });
  }

  async findByRole(role: UserRole): Promise<User[]> {
    return this.usersRepository.find({
      where: { role, isActive: true },
      order: { firstName: 'ASC' },
    });
  }

  async create(createUserDto: CreateUserDto, createdBy: string): Promise<User> {
    const existing = await this.findByEmail(createUserDto.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(
      createUserDto.password,
      this.configService.get<number>('BCRYPT_ROUNDS', 12),
    );

    const user = this.usersRepository.create({
      ...createUserDto,
      email: createUserDto.email.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);

    await this.auditService.log({
      action: 'user.created',
      entityType: 'User',
      entityId: savedUser.id,
      userId: createdBy,
      newValues: { email: savedUser.email, role: savedUser.role },
    });

    return savedUser;
  }

  async update(id: string, updateUserDto: UpdateUserDto, currentUser: User): Promise<User> {
    const user = await this.findOne(id);

    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== id) {
      throw new ForbiddenException('You can only update your own profile');
    }

    if (updateUserDto.role && currentUser.role !== UserRole.ADMIN) {
      throw new ForbiddenException('Only admins can change user roles');
    }

    const oldValues = { role: user.role, isActive: user.isActive };
    await this.usersRepository.update(id, updateUserDto);
    const updated = await this.findOne(id);

    await this.auditService.log({
      action: 'user.updated',
      entityType: 'User',
      entityId: id,
      userId: currentUser.id,
      oldValues,
      newValues: updateUserDto,
    });

    return updated;
  }

  async updateFcmToken(userId: string, fcmToken: string, requestingUserId: string): Promise<void> {
    if (userId !== requestingUserId) throw new ForbiddenException('Cannot update another user\'s FCM token');
    await this.usersRepository.update(userId, { fcmToken });
  }

  async deactivate(id: string, deletedBy: string): Promise<void> {
    const user = await this.findOne(id);
    await this.usersRepository.update(id, { isActive: false });
    await this.auditService.log({
      action: 'user.deactivated',
      entityType: 'User',
      entityId: id,
      userId: deletedBy,
      oldValues: { isActive: user.isActive },
      newValues: { isActive: false },
    });
  }
}
