import {
  Controller, Get, Post, Body, Patch, Param, Delete,
  Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SitesService } from './sites.service';
import { CreateSiteDto } from './dto/create-site.dto';
import { UpdateSiteDto } from './dto/update-site.dto';
import { PaginationDto } from '../common/dto/pagination.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Sites')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('sites')
export class SitesController {
  constructor(private readonly sitesService: SitesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all sites' })
  findAll(@Query() paginationDto: PaginationDto, @CurrentUser() user: any) {
    return this.sitesService.findAll(paginationDto, user);
  }

  @Get('map')
  @ApiOperation({ summary: 'Get sites for map view with coordinates' })
  getMapSites(@CurrentUser() user: any) {
    return this.sitesService.getMapSites(user);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get site by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.findOne(id);
  }

  @Get(':id/qr-code')
  @ApiOperation({ summary: 'Get site QR code' })
  getQrCode(@Param('id', ParseUUIDPipe) id: string) {
    return this.sitesService.generateQrCode(id);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create new site' })
  create(@Body() createSiteDto: CreateSiteDto, @CurrentUser('id') userId: string) {
    return this.sitesService.create(createSiteDto, userId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Update site' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateSiteDto: UpdateSiteDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.sitesService.update(id, updateSiteDto, userId);
  }

  @Post(':id/assign-supervisor/:supervisorId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Assign supervisor to site' })
  assignSupervisor(
    @Param('id', ParseUUIDPipe) siteId: string,
    @Param('supervisorId', ParseUUIDPipe) supervisorId: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.sitesService.assignSupervisor(siteId, supervisorId, userId);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete site (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string, @CurrentUser('id') userId: string) {
    return this.sitesService.remove(id, userId);
  }
}
