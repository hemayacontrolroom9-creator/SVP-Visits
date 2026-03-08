import { IsEnum, IsOptional, IsString } from 'class-validator';
import { AlertStatus } from '../entities/alert.entity';

export class UpdateAlertDto {
  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @IsString()
  @IsOptional()
  resolution?: string;
}
