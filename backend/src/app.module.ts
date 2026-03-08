import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ScheduleModule } from '@nestjs/schedule';
import { WinstonModule } from 'nest-winston';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-ioredis-yet';
import * as winston from 'winston';
import 'winston-loki';

import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VisitsModule } from './visits/visits.module';
import { SitesModule } from './sites/sites.module';
import { ChecklistsModule } from './checklists/checklists.module';
import { ReportsModule } from './reports/reports.module';
import { AlertsModule } from './alerts/alerts.module';
import { NotificationsModule } from './notifications/notifications.module';
import { AuditModule } from './audit/audit.module';
import { UploadsModule } from './uploads/uploads.module';
import { RealtimeModule } from './realtime/realtime.module';
import { HealthModule } from './health/health.module';
import { MetricsModule } from './metrics/metrics.module';
import { databaseConfig } from './config/database.config';
import { appConfig } from './config/app.config';
import { jwtConfig } from './config/jwt.config';
import { storageConfig } from './config/storage.config';
import { emailConfig } from './config/email.config';
import { mapsConfig } from './config/maps.config';
import { LoggerMiddleware } from './common/middleware/logger.middleware';

@Module({
  imports: [
    // ── Configuration ─────────────────────────────────────
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig, databaseConfig, jwtConfig, storageConfig, emailConfig, mapsConfig],
      validationOptions: { allowUnknown: true, abortEarly: false },
    }),

    // ── Logging ───────────────────────────────────────────
    WinstonModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const lokiHost = config.get<string>('LOKI_HOST', '');
        const transports: winston.transport[] = [
          new winston.transports.Console({
            format: winston.format.combine(
              winston.format.timestamp(),
              winston.format.colorize(),
              winston.format.printf(({ timestamp, level, message, context, trace }) => {
                return `${timestamp} [${context || 'App'}] ${level}: ${message}${trace ? `\n${trace}` : ''}`;
              }),
            ),
          }),
        ];

        // Only add Loki transport if host is configured
        if (lokiHost && config.get('NODE_ENV') !== 'test') {
          transports.push(
            new (winston.transports as any).LokiTransport({
              host: lokiHost,
              labels: { app: 'hemaya-vms-backend', env: config.get('NODE_ENV', 'development') },
              json: true,
              format: winston.format.json(),
              replaceTimestamp: true,
              onConnectionError: (err: Error) => console.error('Loki connection error:', err.message),
            }),
          );
        }

        return { transports, level: config.get('LOG_LEVEL', 'info') };
      },
      inject: [ConfigService],
    }),

    // ── Database ──────────────────────────────────────────
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        host: config.get('DB_HOST', 'localhost'),
        port: config.get<number>('DB_PORT', 5432),
        username: config.get('DB_USERNAME', 'postgres'),
        password: config.get<string>('DB_PASSWORD'),
        database: config.get('DB_NAME', 'supervisor_visits'),
        ssl: config.get('DB_SSL', 'false') === 'true' ? { rejectUnauthorized: false } : false,
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: false,
        logging: config.get('NODE_ENV') === 'development' ? ['error', 'warn'] : ['error'],
        retryAttempts: 10,
        retryDelay: 3000,
        extra: {
          max: config.get<number>('DB_POOL_MAX', 20),
          min: config.get<number>('DB_POOL_MIN', 2),
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        },
      }),
    }),

    // ── Cache (Redis via ioredis) ─────────────────────────
    CacheModule.registerAsync({
      isGlobal: true,
      inject: [ConfigService],
      useFactory: async (config: ConfigService) => {
        const password = config.get<string>('REDIS_PASSWORD', '');
        return {
          store: redisStore,
          host: config.get('REDIS_HOST', 'localhost'),
          port: config.get<number>('REDIS_PORT', 6379),
          ...(password ? { password } : {}),
          db: config.get<number>('REDIS_DB', 0),
          ttl: config.get<number>('REDIS_TTL', 3600),
          retryStrategy: (times: number) => Math.min(times * 100, 3000),
        };
      },
    }),

    // ── Rate Limiting ─────────────────────────────────────
    ThrottlerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => [
        {
          name: 'default',
          ttl: config.get<number>('THROTTLE_TTL', 60) * 1000,
          limit: config.get<number>('THROTTLE_LIMIT', 100),
        },
        {
          name: 'auth',
          ttl: 60 * 1000,
          limit: config.get<number>('THROTTLE_LOGIN_LIMIT', 5),
        },
      ],
    }),

    // ── Event Emitter ─────────────────────────────────────
    EventEmitterModule.forRoot({
      wildcard: true,
      delimiter: '.',
      maxListeners: 20,
      verboseMemoryLeak: true,
    }),

    // ── Scheduler ─────────────────────────────────────────
    ScheduleModule.forRoot(),

    // ── Feature Modules ───────────────────────────────────
    AuthModule,
    UsersModule,
    VisitsModule,
    SitesModule,
    ChecklistsModule,
    ReportsModule,
    AlertsModule,
    NotificationsModule,
    AuditModule,
    UploadsModule,
    RealtimeModule,
    HealthModule,
    MetricsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
