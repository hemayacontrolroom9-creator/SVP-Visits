import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';
import { User } from '../users/entities/user.entity';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;
  private emailTransporter: nodemailer.Transporter;

  constructor(
    private configService: ConfigService,
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {
    this.initFirebase();
    this.initEmail();
  }

  private initFirebase() {
    try {
      const projectId = this.configService.get('FIREBASE_PROJECT_ID');
      if (projectId) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey: this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n'),
            clientEmail: this.configService.get('FIREBASE_CLIENT_EMAIL'),
          }),
        });
      }
    } catch (err) {
      this.logger.warn('Firebase not configured, push notifications disabled');
    }
  }

  private initEmail() {
    this.emailTransporter = nodemailer.createTransport({
      host: this.configService.get('SMTP_HOST'),
      port: this.configService.get<number>('SMTP_PORT', 587),
      secure: this.configService.get('SMTP_SECURE') === 'true',
      auth: {
        user: this.configService.get('SMTP_USER'),
        pass: this.configService.get('SMTP_PASS'),
      },
    });
  }

  async sendPushNotification(userIds: string[], title: string, body: string, data?: Record<string, string>) {
    if (!this.firebaseApp) return;
    try {
      const users = await this.usersRepository.find({
        where: { id: In(userIds) },
        select: ['id', 'fcmToken'],
      });

      const tokens = users.map((u) => u.fcmToken).filter(Boolean);
      if (!tokens.length) return;

      await admin.messaging().sendEachForMulticast({
        tokens,
        notification: { title, body },
        data: data || {},
        android: { priority: 'high' },
        apns: { payload: { aps: { sound: 'default' } } },
      });
    } catch (err) {
      this.logger.error('Push notification failed', err);
    }
  }

  async sendEmail(to: string | string[], subject: string, html: string) {
    try {
      await this.emailTransporter.sendMail({
        from: `${this.configService.get('EMAIL_FROM_NAME')} <${this.configService.get('EMAIL_FROM')}>`,
        to: Array.isArray(to) ? to.join(',') : to,
        subject,
        html,
      });
    } catch (err) {
      this.logger.error(`Email send failed to ${to}`, err);
    }
  }

  async notifyVisitScheduled(supervisorEmail: string, supervisorFcmToken: string, visitDetails: any) {
    await Promise.all([
      this.sendEmail(supervisorEmail, 'New Visit Scheduled', `
        <h2>New Visit Scheduled</h2>
        <p>A new visit has been scheduled for you:</p>
        <ul>
          <li>Site: ${visitDetails.site}</li>
          <li>Date: ${new Date(visitDetails.scheduledAt).toLocaleString()}</li>
        </ul>
      `),
    ]);
  }
}
