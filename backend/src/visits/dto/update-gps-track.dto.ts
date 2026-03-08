import { IsArray, ValidateNested, IsNumber, IsString, IsOptional } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

class GpsPointDto {
  @IsNumber() lat: number;
  @IsNumber() lng: number;
  @IsString() timestamp: string;
  @IsOptional() @IsNumber() accuracy?: number;
}

export class UpdateGpsTrackDto {
  @ApiProperty({ type: [GpsPointDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GpsPointDto)
  points: GpsPointDto[];
}
