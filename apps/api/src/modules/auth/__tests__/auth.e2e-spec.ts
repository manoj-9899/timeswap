import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import fastifyHelmet from '@fastify/helmet';
import { AppModule } from '../../../app.module';
import { prisma } from '@timeswap/database';
import request from 'supertest';

describe('Auth API (E2E Integration)', () => {
  let app: NestFastifyApplication;

  const testEmail = `e2e_user_${Date.now()}@example.com`;
  const testPassword = 'Password123!';
  let verificationToken: string;
  let sessionCookie: string;
  let userId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    app.setGlobalPrefix('api/v1');

    await app.register(fastifyHelmet as any, { contentSecurityPolicy: false });
    await app.register(fastifyCookie as any, { secret: 'test-secret' });

    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.delete({ where: { id: userId } }).catch(() => {});
    }
    await app.close();
  });

  it('POST /api/v1/auth/register - Register new user', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        display_name: 'Test User',
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.status).toBe('UNVERIFIED');

    userId = res.body.data.user_id;

    // Fetch verification token from database to simulate user clicking email link
    const dbToken = await prisma.verificationToken.findFirst({
      where: { userId },
    });
    expect(dbToken).not.toBeNull();
    verificationToken = dbToken!.token;
  });

  it('POST /api/v1/auth/register - Conflict 409 on duplicate email', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/register')
      .send({
        email: testEmail,
        password: testPassword,
        display_name: 'Duplicate User',
      });

    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('EMAIL_ALREADY_REGISTERED');
  });

  it('POST /api/v1/auth/verify-email - Verify email address', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/verify-email')
      .send({ token: verificationToken });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.status).toBe('ACTIVE');
    expect(res.body.data.email_verified).toBe(true);
  });

  it('POST /api/v1/auth/login - Fail with wrong password (401)', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: 'WrongPassword123!',
      });

    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('POST /api/v1/auth/login - Login successfully & issue session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);

    const cookies = res.headers['set-cookie'];
    expect(cookies).toBeDefined();
    expect(cookies[0]).toContain('timeswap_session=');
    sessionCookie = cookies[0];
  });

  it('GET /api/v1/auth/me - Access protected session endpoint', async () => {
    const res = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
    expect(res.body.data.roles).toContain('USER');
  });

  it('GET /api/v1/users/:id - Forbidden 403 for non-admin user', async () => {
    const res = await request(app.getHttpServer())
      .get(`/api/v1/users/${userId}`)
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it('POST /api/v1/auth/logout - Logout & invalidate session cookie', async () => {
    const res = await request(app.getHttpServer())
      .post('/api/v1/auth/logout')
      .set('Cookie', sessionCookie);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    // Verify session is now revoked
    const meRes = await request(app.getHttpServer())
      .get('/api/v1/auth/me')
      .set('Cookie', sessionCookie);

    expect(meRes.status).toBe(401);
  });
});
