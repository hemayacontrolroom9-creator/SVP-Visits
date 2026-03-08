import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { Visit } from '../visits/entities/visit.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';
import { Alert } from '../alerts/entities/alert.entity';
import { ChecklistResponse } from '../checklists/entities/checklist-response.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Visit, Site, User, Alert, ChecklistResponse])],
  controllers: [ReportsController],
  providers: [ReportsService],
  exports: [ReportsService],
})
export class ReportsModule {}
