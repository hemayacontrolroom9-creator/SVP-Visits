import { IsUUID, IsArray, IsBoolean, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

class AnswerDto {
  @IsString() itemId: string;
  @IsString() question: string;
  answer: any;
  @IsOptional() photoUrls?: string[];
  @IsOptional() notes?: string;
}

export class SubmitChecklistResponseDto {
  @ApiProperty()
  @IsUUID()
  templateId: string;

  @ApiProperty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiPropertyOptional({ default: false })
  @IsOptional()
  @IsBoolean()
  isSubmitted?: boolean = false;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}
