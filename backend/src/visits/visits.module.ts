import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { VisitsController } from './visits.controller';
import { VisitsService } from './visits.service';
import { Visit } from './entities/visit.entity';
import { Site } from '../sites/entities/site.entity';
import { User } from '../users/entities/user.entity';
import { AuditModule } from '../audit/audit.module';
import { AlertsModule } from '../alerts/alerts.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { RealtimeModule } from '../realtime/realtime.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Visit, Site, User]),
    AuditModule, AlertsModule, NotificationsModule, RealtimeModule,
  ],
  controllers: [VisitsController],
  providers: [VisitsService],
  exports: [VisitsService, TypeOrmModule],
})
export class VisitsModule {}
