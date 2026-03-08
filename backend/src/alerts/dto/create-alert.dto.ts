import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { AlertSeverity, AlertType } from '../entities/alert.entity';

export class CreateAlertDto {
  @IsEnum(AlertType)
  type: AlertType;

  @IsEnum(AlertSeverity)
  severity: AlertSeverity;

  @IsString()
  message: string;

  @IsUUID()
  @IsOptional()
  visitId?: string;

  @IsUUID()
  @IsOptional()
  siteId?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @IsString()
  @IsOptional()
  metadata?: Record<string, any>;
}
