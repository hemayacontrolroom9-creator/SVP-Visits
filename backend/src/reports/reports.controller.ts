import { Controller, Get, Query, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { Response } from 'express';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Reports')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Get dashboard summary statistics' })
  getDashboard(@CurrentUser() user: any) {
    return this.reportsService.getDashboardStats(user);
  }

  @Get('visits/summary')
  @ApiOperation({ summary: 'Get visit summary report' })
  getVisitSummary(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
    @CurrentUser() user: any,
  ) {
    return this.reportsService.getVisitSummary(startDate, endDate, user);
  }

  @Get('visits/by-supervisor')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get visit counts by supervisor' })
  getVisitsBySupervisor(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getVisitsBySupervisor(startDate, endDate);
  }

  @Get('visits/by-site')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get visit counts by site' })
  getVisitsBySite(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getVisitsBySite(startDate, endDate);
  }

  @Get('compliance')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Get compliance rate report' })
  getComplianceReport(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getComplianceReport(startDate, endDate);
  }

  @Get('activity/heatmap')
  @ApiOperation({ summary: 'Get activity heatmap data' })
  getActivityHeatmap(
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.reportsService.getActivityHeatmap(startDate, endDate);
  }
}
