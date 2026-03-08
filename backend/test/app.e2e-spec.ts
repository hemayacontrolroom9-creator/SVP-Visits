import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Hemaya VMS API (e2e)', () => {
  let app: INestApplication;
  let accessToken: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  // ── Auth ──────────────────────────────────────────────
  describe('Auth', () => {
    it('POST /auth/login — should return tokens with valid credentials', async () => {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@hemaya.ae', password: 'Admin@123456' })
        .expect(200);

      expect(res.body.data).toHaveProperty('accessToken');
      expect(res.body.data).toHaveProperty('refreshToken');
      accessToken = res.body.data.accessToken;
    });

    it('POST /auth/login — should reject invalid credentials', async () => {
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: 'admin@hemaya.ae', password: 'wrongpassword' })
        .expect(401);
    });

    it('GET /auth/me — should return current user when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/auth/me')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('email', 'admin@hemaya.ae');
    });

    it('GET /auth/me — should return 401 without token', async () => {
      await request(app.getHttpServer()).get('/auth/me').expect(401);
    });
  });

  // ── Sites ─────────────────────────────────────────────
  describe('Sites', () => {
    it('GET /sites — should return list of sites', async () => {
      const res = await request(app.getHttpServer())
        .get('/sites')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(Array.isArray(res.body.data.items)).toBe(true);
    });

    it('POST /sites — should create a new site', async () => {
      const res = await request(app.getHttpServer())
        .post('/sites')
        .set('Authorization', `Bearer ${accessToken}`)
        .send({
          name: 'Test Site E2E',
          code: 'TST-E2E',
          address: '123 Test Street, Dubai',
          city: 'Dubai',
          latitude: 25.2048,
          longitude: 55.2708,
          geofenceRadius: 100,
        })
        .expect(201);

      expect(res.body.data).toHaveProperty('id');
      expect(res.body.data.name).toBe('Test Site E2E');
    });
  });

  // ── Visits ────────────────────────────────────────────
  describe('Visits', () => {
    it('GET /visits — should return paginated visits', async () => {
      const res = await request(app.getHttpServer())
        .get('/visits')
        .set('Authorization', `Bearer ${accessToken}`)
        .expect(200);

      expect(res.body.data).toHaveProperty('items');
      expect(res.body.data).toHaveProperty('total');
    });
  });

  // ── Health ────────────────────────────────────────────
  describe('Health', () => {
    it('GET /health — should return healthy status', async () => {
      const res = await request(app.getHttpServer()).get('/health').expect(200);
      expect(res.body.status).toBe('ok');
    });
  });
});
