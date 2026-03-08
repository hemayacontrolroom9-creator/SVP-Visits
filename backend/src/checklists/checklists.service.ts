import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { Visit, VisitStatus } from '../visits/entities/visit.entity';
import { CreateChecklistTemplateDto } from './dto/create-checklist-template.dto';
import { SubmitChecklistResponseDto } from './dto/submit-checklist-response.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class ChecklistsService {
  constructor(
    @InjectRepository(ChecklistTemplate) private templatesRepo: Repository<ChecklistTemplate>,
    @InjectRepository(ChecklistResponse) private responsesRepo: Repository<ChecklistResponse>,
    @InjectRepository(Visit) private visitsRepo: Repository<Visit>,
    private auditService: AuditService,
  ) {}

  async getTemplates() {
    return this.templatesRepo.find({ where: { isActive: true }, order: { name: 'ASC' } });
  }

  async getTemplate(id: string) {
    const template = await this.templatesRepo.findOne({ where: { id } });
    if (!template) throw new NotFoundException('Template not found');
    return template;
  }

  async createTemplate(dto: CreateChecklistTemplateDto, userId: string) {
    const template = this.templatesRepo.create({ ...dto, createdBy: userId });
    const saved = await this.templatesRepo.save(template);
    await this.auditService.log({
      action: 'checklist.template_created',
      entityType: 'ChecklistTemplate',
      entityId: saved.id,
      userId,
    });
    return saved;
  }

  async submitResponse(visitId: string, dto: SubmitChecklistResponseDto, userId: string) {
    const visit = await this.visitsRepo.findOne({ where: { id: visitId } });
    if (!visit) throw new NotFoundException('Visit not found');
    if (visit.status !== VisitStatus.IN_PROGRESS) {
      throw new BadRequestException('Visit must be in progress to submit checklist');
    }

    const template = await this.getTemplate(dto.templateId);
    const requiredItems = template.items.filter((i) => i.required);
    const answeredIds = dto.answers.map((a) => a.itemId);
    const missingRequired = requiredItems.filter((i) => !answeredIds.includes(i.id));

    if (missingRequired.length > 0 && dto.isSubmitted) {
      throw new BadRequestException(`Missing required items: ${missingRequired.map((i) => i.question).join(', ')}`);
    }

    const score = this.calculateScore(dto.answers, template.items);
    const existing = await this.responsesRepo.findOne({
      where: { visitId, templateId: dto.templateId },
    });

    if (existing) {
      await this.responsesRepo.update(existing.id, {
        answers: dto.answers,
        isSubmitted: dto.isSubmitted,
        submittedAt: dto.isSubmitted ? new Date() : null,
        score,
        totalItems: template.items.length,
        completedItems: dto.answers.length,
        notes: dto.notes,
      });
      return this.responsesRepo.findOne({ where: { id: existing.id } });
    }

    const response = this.responsesRepo.create({
      visitId,
      templateId: dto.templateId,
      answers: dto.answers,
      submittedBy: userId,
      isSubmitted: dto.isSubmitted,
      submittedAt: dto.isSubmitted ? new Date() : null,
      score,
      totalItems: template.items.length,
      completedItems: dto.answers.length,
      notes: dto.notes,
    });

    return this.responsesRepo.save(response);
  }

  async getVisitResponses(visitId: string) {
    return this.responsesRepo.find({
      where: { visitId },
      relations: ['template'],
    });
  }

  private calculateScore(answers: any[], items: any[]): number {
    if (!answers.length) return 0;
    const answeredRequired = items.filter(
      (i) => i.required && answers.some((a) => a.itemId === i.id),
    ).length;
    const totalRequired = items.filter((i) => i.required).length;
    if (!totalRequired) return 100;
    return Math.round((answeredRequired / totalRequired) * 100);
  }
}
