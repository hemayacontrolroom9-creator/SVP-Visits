import { IsString, IsUUID, IsDateString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVisitDto {
  @ApiProperty()
  @IsUUID()
  supervisorId: string;

  @ApiProperty()
  @IsUUID()
  siteId: string;

  @ApiProperty({ example: '2024-06-15T09:00:00Z' })
  @IsDateString()
  scheduledAt: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
