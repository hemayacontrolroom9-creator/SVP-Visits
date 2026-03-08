import {
  Controller, Get, Post, Body, Patch, Param, Delete, Query,
  UseGuards, ParseUUIDPipe, HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VisitsService } from './visits.service';
import { CreateVisitDto } from './dto/create-visit.dto';
import { UpdateVisitDto } from './dto/update-visit.dto';
import { CheckInDto } from './dto/check-in.dto';
import { CheckOutDto } from './dto/check-out.dto';
import { FilterVisitsDto } from './dto/filter-visits.dto';
import { UpdateGpsTrackDto } from './dto/update-gps-track.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Visits')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('visits')
export class VisitsController {
  constructor(private readonly visitsService: VisitsService) {}

  @Get()
  @ApiOperation({ summary: 'Get all visits with filters' })
  findAll(@Query() filterDto: FilterVisitsDto, @CurrentUser() user: any) {
    return this.visitsService.findAll(filterDto, user);
  }

  @Get('my-visits')
  @Roles(UserRole.SUPERVISOR)
  @ApiOperation({ summary: 'Get visits for current supervisor' })
  getMyVisits(@Query() filterDto: FilterVisitsDto, @CurrentUser('id') userId: string) {
    return this.visitsService.getSupervisorVisits(userId, filterDto);
  }

  @Get('today')
  @ApiOperation({ summary: 'Get today scheduled visits' })
  getTodayVisits(@CurrentUser() user: any) {
    return this.visitsService.getTodayVisits(user);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get currently active/in-progress visits' })
  getActiveVisits() {
    return this.visitsService.getActiveVisits();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get visit by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.visitsService.findOne(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Schedule a new visit' })
  create(@Body() createVisitDto: CreateVisitDto, @CurrentUser('id') userId: string) {
    return this.visitsService.create(createVisitDto, userId);
  }

  @Post(':id/check-in')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check in to a visit (GPS + optional QR)' })
  checkIn(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() checkInDto: CheckInDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.checkIn(id, checkInDto, userId);
  }

  @Post(':id/check-out')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Check out from a visit' })
  checkOut(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() checkOutDto: CheckOutDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.checkOut(id, checkOutDto, userId);
  }

  @Patch(':id/gps-track')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update GPS tracking data during visit' })
  updateGpsTrack(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateGpsTrackDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.updateGpsTrack(id, dto, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update visit details' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVisitDto: UpdateVisitDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.visitsService.update(id, updateVisitDto, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Cancel/delete a visit' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.visitsService.cancel(id, userId);
  }
}
