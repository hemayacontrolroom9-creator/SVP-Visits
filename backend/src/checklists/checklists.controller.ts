import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseUUIDPipe } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ChecklistsService } from './checklists.service';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { SubmitChecklistResponseDto } from './dto/submit-checklist-response.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles, UserRole } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Checklists')
@ApiBearerAuth('access-token')
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('checklists')
export class ChecklistsController {
  constructor(private readonly checklistsService: ChecklistsService) {}

  @Get('templates')
  @ApiOperation({ summary: 'Get all checklist templates' })
  getTemplates() {
    return this.checklistsService.getTemplates();
  }

  @Get('templates/:id')
  @ApiOperation({ summary: 'Get template by ID' })
  getTemplate(@Param('id', ParseUUIDPipe) id: string) {
    return this.checklistsService.getTemplate(id);
  }

  @Post('templates')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  @ApiOperation({ summary: 'Create checklist template' })
  createTemplate(@Body() dto: CreateChecklistTemplateDto, @CurrentUser('id') userId: string) {
    return this.checklistsService.createTemplate(dto, userId);
  }

  @Post('visits/:visitId/submit')
  @ApiOperation({ summary: 'Submit checklist response for a visit' })
  submitResponse(
    @Param('visitId', ParseUUIDPipe) visitId: string,
    @Body() dto: SubmitChecklistResponseDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.checklistsService.submitResponse(visitId, dto, userId);
  }

  @Get('visits/:visitId/responses')
  @ApiOperation({ summary: 'Get checklist responses for a visit' })
  getVisitResponses(@Param('visitId', ParseUUIDPipe) visitId: string) {
    return this.checklistsService.getVisitResponses(visitId);
  }
}
