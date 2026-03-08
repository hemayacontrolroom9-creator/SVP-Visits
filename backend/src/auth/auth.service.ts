import {
  Injectable, UnauthorizedException, ConflictException,
  BadRequestException, NotFoundException, Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

import { User } from '../users/entities/user.entity';
import { RefreshToken } from './entities/refresh-token.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
    @InjectRepository(RefreshToken) private refreshTokenRepository: Repository<RefreshToken>,
    private jwtService: JwtService,
    private configService: ConfigService,
    private auditService: AuditService,
  ) {}

  async validateUser(email: string, password: string): Promise<User | null> {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
      select: ['id', 'email', 'password', 'role', 'isActive', 'firstName', 'lastName'],
    });
    if (!user || !user.isActive) return null;
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) return null;
    return user;
  }

  async login(loginDto: LoginDto, ip: string, userAgent?: string) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      await this.auditService.log({
        action: 'auth.login_failed',
        entityType: 'User',
        metadata: { email: loginDto.email, ip },
      });
      throw new UnauthorizedException('Invalid email or password');
    }

    await this.usersRepository.update(user.id, { lastLoginAt: new Date(), lastLoginIp: ip });
    const tokens = await this.generateTokens(user);

    await this.auditService.log({
      action: 'auth.login_success',
      entityType: 'User',
      entityId: user.id,
      userId: user.id,
      metadata: { ip, userAgent },
    });

    this.logger.log(`User ${user.email} logged in from ${ip}`);
    return { ...tokens, user: this.sanitizeUser(user) };
  }

  async register(registerDto: RegisterDto, ip: string) {
    const existing = await this.usersRepository.findOne({
      where: { email: registerDto.email.toLowerCase() },
    });
    if (existing) throw new ConflictException('Email already registered');

    const hashedPassword = await bcrypt.hash(
      registerDto.password,
      this.configService.get<number>('BCRYPT_ROUNDS', 12),
    );

    const user = this.usersRepository.create({
      ...registerDto,
      email: registerDto.email.toLowerCase(),
      password: hashedPassword,
    });

    const savedUser = await this.usersRepository.save(user);
    const tokens = await this.generateTokens(savedUser);

    await this.auditService.log({
      action: 'auth.register',
      entityType: 'User',
      entityId: savedUser.id,
      userId: savedUser.id,
      metadata: { ip },
    });

    return { ...tokens, user: this.sanitizeUser(savedUser) };
  }

  async refreshTokens(userId: string, refreshToken: string) {
    const tokenRecord = await this.refreshTokenRepository.findOne({
      where: { token: refreshToken, userId, isRevoked: false },
    });

    if (!tokenRecord || tokenRecord.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const user = await this.usersRepository.findOne({ where: { id: userId, isActive: true } });
    if (!user) throw new UnauthorizedException('User not found or inactive');

    await this.refreshTokenRepository.update(tokenRecord.id, { isRevoked: true });
    return this.generateTokens(user);
  }

  async logout(userId: string, refreshToken: string) {
    await this.refreshTokenRepository.update(
      { token: refreshToken, userId },
      { isRevoked: true },
    );
    await this.auditService.log({
      action: 'auth.logout',
      entityType: 'User',
      entityId: userId,
      userId,
    });
    return { message: 'Logged out successfully' };
  }

  async getProfile(userId: string) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      relations: ['managedSites'],
    });
    if (!user) throw new NotFoundException('User not found');
    return this.sanitizeUser(user);
  }

  async forgotPassword(email: string) {
    const user = await this.usersRepository.findOne({
      where: { email: email.toLowerCase() },
    });
    // Always return success to prevent email enumeration
    if (!user) return { message: 'If email exists, reset instructions have been sent' };

    const resetToken = uuidv4();
    const expiry = new Date(Date.now() + 3600000); // 1 hour

    await this.usersRepository.update(user.id, {
      passwordResetToken: await bcrypt.hash(resetToken, 10),
      passwordResetExpiry: expiry,
    });

    // TODO: Send email with reset token
    this.logger.log(`Password reset requested for ${email}`);
    return { message: 'If email exists, reset instructions have been sent' };
  }

  async resetPassword(token: string, newPassword: string) {
    const users = await this.usersRepository.find({
      where: { passwordResetExpiry: new Date() },
      select: ['id', 'passwordResetToken', 'passwordResetExpiry'],
    });

    // This is simplified - in production, find by token properly
    throw new BadRequestException('Invalid or expired reset token');
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.usersRepository.findOne({
      where: { id: userId },
      select: ['id', 'password'],
    });
    if (!user) throw new NotFoundException('User not found');

    const isCurrentValid = await bcrypt.compare(dto.currentPassword, user.password);
    if (!isCurrentValid) throw new BadRequestException('Current password is incorrect');

    const hashedNew = await bcrypt.hash(
      dto.newPassword,
      this.configService.get<number>('BCRYPT_ROUNDS', 12),
    );
    await this.usersRepository.update(userId, { password: hashedNew });

    await this.auditService.log({
      action: 'auth.password_changed',
      entityType: 'User',
      entityId: userId,
      userId,
    });

    return { message: 'Password changed successfully' };
  }

  private async generateTokens(user: User) {
    const payload = { sub: user.id, email: user.email, role: user.role };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload),
      this.jwtService.signAsync(payload, {
        secret: this.configService.get('JWT_REFRESH_SECRET'),
        expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION', '7d'),
      }),
    ]);

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    await this.refreshTokenRepository.save(
      this.refreshTokenRepository.create({
        token: refreshToken,
        userId: user.id,
        expiresAt,
      }),
    );

    return { accessToken, refreshToken };
  }

  private sanitizeUser(user: User) {
    const { password, passwordResetToken, passwordResetExpiry, ...sanitized } = user as any;
    return sanitized;
  }
}
