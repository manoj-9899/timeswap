import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service.js';

describe('MarketplaceModule (E2E)', () => {
  let app: NestFastifyApplication;
  let passwordService: PasswordService;

  let userOneId: string;
  let userOneCookie: string;
  let userTwoId: string;
  let userTwoCookie: string;
  let categoryId: string;

  let createdOfferId: string;
  let createdRequestId: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    
    await app.register(fastifyCookie as any, {
      secret: process.env.COOKIE_SECRET || 'timeswap-dev-cookie-secret-min-32-chars!!',
    });

    app.setGlobalPrefix('api/v1');

    passwordService = moduleRef.get<PasswordService>(PasswordService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Clean test records
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "messages", "message_threads", "reviews", "dispute_cases", "escrow_holds", "sessions", "bookings", "journal_entries", "ledger_transactions", "ledger_accounts", "service_offers", "help_requests", "profile_skills", "profiles", "users" CASCADE;`);

    // Fetch taxonomy category
    let category = await prisma.skillCategory.findFirst();
    if (!category) {
      category = await prisma.skillCategory.create({
        data: {
          name: 'Tech Test',
          slug: 'tech-test',
        },
      });
    }
    categoryId = category.id;

    // Create User One (Provider)
    const passwordHash1 = await passwordService.hashPassword('Password123!');
    const userOne = await prisma.user.create({
      data: {
        email: 'provider@example.com',
        status: 'ACTIVE',
        credential: {
          create: {
            passwordHash: passwordHash1,
          },
        },
        profile: {
          create: {
            displayName: 'Provider User',
            handle: 'provider_user',
            city: 'San Francisco',
            generalDistrict: 'Mission',
          },
        },
      },
    });
    userOneId = userOne.id;

    const rawTokenOne = 'session-provider-token';
    await prisma.sessionToken.create({
      data: {
        userId: userOne.id,
        tokenHash: createHash('sha256').update(rawTokenOne).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    userOneCookie = `timeswap_session=${rawTokenOne}`;

    // Create User Two (Requester)
    const passwordHash2 = await passwordService.hashPassword('Password123!');
    const userTwo = await prisma.user.create({
      data: {
        email: 'requester@example.com',
        status: 'ACTIVE',
        credential: {
          create: {
            passwordHash: passwordHash2,
          },
        },
        profile: {
          create: {
            displayName: 'Requester User',
            handle: 'requester_user',
            city: 'San Francisco',
            generalDistrict: 'SoMa',
          },
        },
      },
    });
    userTwoId = userTwo.id;

    const rawTokenTwo = 'session-requester-token';
    await prisma.sessionToken.create({
      data: {
        userId: userTwo.id,
        tokenHash: createHash('sha256').update(rawTokenTwo).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    userTwoCookie = `timeswap_session=${rawTokenTwo}`;
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Service Offers Lifecycle', () => {
    it('should create a service offer as an authenticated user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/offers',
        headers: { cookie: userOneCookie },
        payload: {
          title: 'Fullstack React & NestJS Mentorship',
          description: 'I offer 1-on-1 pairing sessions for building scalable web apps with TypeScript.',
          category_id: categoryId,
          supported_durations: [60],
          delivery_format: 'ONLINE',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Fullstack React & NestJS Mentorship');
      expect(json.data.status).toBe('PUBLISHED');
      expect(json.data.provider.handle).toBe('provider_user');

      createdOfferId = json.data.id;
    });

    it('should retrieve public service offer details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/offers/${createdOfferId}`,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdOfferId);
      expect(json.data.provider.display_name).toBe('Provider User');
    });

    it('should update service offer by owner', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/offers/${createdOfferId}`,
        headers: { cookie: userOneCookie },
        payload: {
          title: 'Advanced React & NestJS Mentorship',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Advanced React & NestJS Mentorship');
    });

    it('should reject update on service offer by non-owner with 403', async () => {
      const res = await app.inject({
        method: 'PATCH',
        url: `/api/v1/offers/${createdOfferId}`,
        headers: { cookie: userTwoCookie },
        payload: {
          title: 'Hacked Title',
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it('should pause and publish service offer by owner', async () => {
      // Pause
      const pauseRes = await app.inject({
        method: 'POST',
        url: `/api/v1/offers/${createdOfferId}/pause`,
        headers: { cookie: userOneCookie },
      });
      expect(pauseRes.statusCode).toBe(200);
      expect(JSON.parse(pauseRes.body).data.status).toBe('PAUSED');

      // Publish
      const pubRes = await app.inject({
        method: 'POST',
        url: `/api/v1/offers/${createdOfferId}/publish`,
        headers: { cookie: userOneCookie },
      });
      expect(pubRes.statusCode).toBe(200);
      expect(JSON.parse(pubRes.body).data.status).toBe('PUBLISHED');
    });

    it('should return user offers list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/offers',
        headers: { cookie: userOneCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe('Help Requests Lifecycle', () => {
    it('should create a help request as an authenticated user', async () => {
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/requests',
        headers: { cookie: userTwoCookie },
        payload: {
          title: 'Need help with Docker Compose setup',
          description: 'Looking for an experienced developer to guide me through multi-container setup.',
          category_id: categoryId,
          target_duration: 60,
          preferred_format: 'ONLINE',
          urgency: 'THIS_WEEK',
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.title).toBe('Need help with Docker Compose setup');
      expect(json.data.status).toBe('OPEN');
      expect(json.data.requester.handle).toBe('requester_user');

      createdRequestId = json.data.id;
    });

    it('should retrieve public help request details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/requests/${createdRequestId}`,
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(createdRequestId);
      expect(json.data.requester.display_name).toBe('Requester User');
    });

    it('should allow another user to submit a proposal to help', async () => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/requests/${createdRequestId}/proposals`,
        headers: { cookie: userOneCookie },
        payload: {
          proposed_start_time: startTime,
          duration_minutes: 60,
          message: 'I can help you configure your Docker network and compose scripts tomorrow!',
        },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.proposal_submitted).toBe(true);
    });

    it('should reject proposal to own request with 403', async () => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/requests/${createdRequestId}/proposals`,
        headers: { cookie: userTwoCookie },
        payload: {
          proposed_start_time: startTime,
          duration_minutes: 60,
          message: 'Self proposal message',
        },
      });

      expect(res.statusCode).toBe(403);
    });

    it('should close help request by owner', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/requests/${createdRequestId}/close`,
        headers: { cookie: userTwoCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('CLOSED');
    });

    it('should return user requests list', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/users/me/requests',
        headers: { cookie: userTwoCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.body);
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });
});
