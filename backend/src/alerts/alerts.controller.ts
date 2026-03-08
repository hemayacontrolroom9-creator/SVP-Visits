import { Controller, Get, Post, Patch, Param, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AlertsService } from './alerts.service';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Alerts')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard)
@Controller('alerts')
export class AlertsController {
  constructor(private readonly alertsService: AlertsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentUser() user: any) {
    return this.alertsService.findAll(paginationDto, user);
  }

  @Patch(':id/acknowledge')
  @ApiOperation({ summary: 'Acknowledge an alert' })
  acknowledge(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.alertsService.acknowledge(id, userId);
  }

  @Patch(':id/resolve')
  @ApiOperation({ summary: 'Resolve an alert' })
  resolve(@Param('id', ParseUUIDPipe) id: string) {
    return this.alertsService.resolve(id);
  }
}
