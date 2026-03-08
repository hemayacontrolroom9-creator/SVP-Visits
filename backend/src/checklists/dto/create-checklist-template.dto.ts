import { IsString, IsArray, IsBoolean, IsOptional, ValidateNested, IsEnum, MinLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ChecklistItemType } from '../entities/checklist-template.entity';

export class ChecklistItemDto {
  @IsString() id: string;
  @IsString() @MinLength(3) question: string;
  @IsEnum(ChecklistItemType) type: ChecklistItemType;
  @IsBoolean() required: boolean;
  @IsOptional() order?: number;
  @IsOptional() options?: string[];
  @IsOptional() helpText?: string;
}

export class CreateChecklistTemplateDto {
  @ApiProperty()
  @IsString()
  @MinLength(3)
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: [ChecklistItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => ChecklistItemDto)
  items: ChecklistItemDto[];
}
