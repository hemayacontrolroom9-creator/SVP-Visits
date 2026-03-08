import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { Transform } from 'class-transformer';
import { AlertSeverity, AlertStatus, AlertType } from '../entities/alert.entity';
import { PaginationDto } from '../../../common/dto/pagination.dto';

export class FilterAlertsDto extends PaginationDto {
  @IsEnum(AlertType)
  @IsOptional()
  type?: AlertType;

  @IsEnum(AlertSeverity)
  @IsOptional()
  severity?: AlertSeverity;

  @IsEnum(AlertStatus)
  @IsOptional()
  status?: AlertStatus;

  @IsUUID()
  @IsOptional()
  siteId?: string;

  @IsUUID()
  @IsOptional()
  supervisorId?: string;

  @Transform(({ value }) => new Date(value))
  @IsOptional()
  from?: Date;

  @Transform(({ value }) => new Date(value))
  @IsOptional()
  to?: Date;
}
