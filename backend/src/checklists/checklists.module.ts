import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ChecklistsController } from './checklists.controller';
import { ChecklistsService } from './checklists.service';
import { ChecklistTemplate } from './entities/checklist-template.entity';
import { ChecklistResponse } from './entities/checklist-response.entity';
import { Visit } from '../visits/entities/visit.entity';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [TypeOrmModule.forFeature([ChecklistTemplate, ChecklistResponse, Visit]), AuditModule],
  controllers: [ChecklistsController],
  providers: [ChecklistsService],
  exports: [ChecklistsService, TypeOrmModule],
})
export class ChecklistsModule {}
