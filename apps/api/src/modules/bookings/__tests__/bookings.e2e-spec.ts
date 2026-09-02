import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service.js';

describe('BookingsModule (E2E)', () => {
  let app: NestFastifyApplication;
  let passwordService: PasswordService;

  let providerId: string;
  let providerCookie: string;
  let requesterId: string;
  let requesterCookie: string;
  let strangerCookie: string;

  let categoryId: string;
  let createdOfferId: string;
  let activeBookingId: string;

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

    // Clean tables
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "messages", "message_threads", "reviews", "dispute_cases", "escrow_holds", "sessions", "bookings", "journal_entries", "ledger_transactions", "ledger_accounts", "service_offers", "help_requests", "profile_skills", "profiles", "users" CASCADE;`);

    // Create or Fetch Category
    let category = await prisma.skillCategory.findFirst();
    if (!category) {
      category = await prisma.skillCategory.create({
        data: { name: 'Technology & Programming', slug: 'technology-programming' },
      });
    }
    categoryId = category.id;

    // Create Provider User
    const pass1 = await passwordService.hashPassword('Password123!');
    const provider = await prisma.user.create({
      data: {
        email: `provider_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash: pass1 } },
        profile: {
          create: {
            displayName: 'Booking Provider',
            handle: `prov_${Date.now()}`,
            city: 'San Francisco',
            generalDistrict: 'Mission',
          },
        },
      },
    });
    providerId = provider.id;

    const rawToken1 = `session-prov-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: providerId,
        tokenHash: createHash('sha256').update(rawToken1).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    providerCookie = `timeswap_session=${rawToken1}`;

    // Create Requester User
    const pass2 = await passwordService.hashPassword('Password123!');
    const requester = await prisma.user.create({
      data: {
        email: `requester_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash: pass2 } },
        profile: {
          create: {
            displayName: 'Booking Requester',
            handle: `req_${Date.now()}`,
            city: 'San Francisco',
            generalDistrict: 'SoMa',
          },
        },
      },
    });
    requesterId = requester.id;

    // Grant Requester initial starter credit
    const sysAcc = await prisma.ledgerAccount.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        accountType: 'SYSTEM_RESERVE',
        balance: -1000.0,
      },
    });
    const reqAcc = await prisma.ledgerAccount.create({
      data: {
        userId: requesterId,
        accountType: 'USER_WALLET',
        balance: 5.0,
      },
    });
    const tx = await prisma.ledgerTransaction.create({
      data: { transactionType: 'ONBOARDING_GRANT' },
    });
    await prisma.journalEntry.create({
      data: { transactionId: tx.id, accountId: sysAcc.id, entryType: 'DEBIT', amount: 5.0 },
    });
    await prisma.journalEntry.create({
      data: { transactionId: tx.id, accountId: reqAcc.id, entryType: 'CREDIT', amount: 5.0 },
    });

    const rawToken2 = `session-req-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: requesterId,
        tokenHash: createHash('sha256').update(rawToken2).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    requesterCookie = `timeswap_session=${rawToken2}`;

    // Create Stranger User
    const pass3 = await passwordService.hashPassword('Password123!');
    const stranger = await prisma.user.create({
      data: {
        email: `stranger_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash: pass3 } },
        profile: {
          create: {
            displayName: 'Stranger User',
            handle: `stranger_${Date.now()}`,
            city: 'Oakland',
            generalDistrict: 'Downtown',
          },
        },
      },
    });

    const rawToken3 = `session-stranger-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: stranger.id,
        tokenHash: createHash('sha256').update(rawToken3).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    strangerCookie = `timeswap_session=${rawToken3}`;

    // Create Service Offer for Provider
    const offer = await prisma.serviceOffer.create({
      data: {
        providerId,
        categoryId,
        title: 'React Strategy & Code Review Session',
        description: 'Detailed 60 minute pairing session.',
        durationMinutes: 60,
        format: 'ONLINE',
        city: 'San Francisco',
        generalDistrict: 'Mission',
        status: 'PUBLISHED',
      },
    });
    createdOfferId = offer.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('Booking Creation & Validation', () => {
    it('should allow a user to book a published service offer', async () => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: { cookie: requesterCookie },
        payload: {
          service_offer_id: createdOfferId,
          scheduled_start_time: startTime,
          duration_minutes: 60,
        },
      });

      expect(res.statusCode).toBe(201);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('PENDING_ACCEPTANCE');
      expect(json.data.credit_amount).toBe(1.0);
      expect(json.data.requester.id).toBe(requesterId);
      expect(json.data.provider.id).toBe(providerId);

      activeBookingId = json.data.id;
    });

    it('should reject self-booking with 400 Bad Request', async () => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: { cookie: providerCookie },
        payload: {
          service_offer_id: createdOfferId,
          scheduled_start_time: startTime,
          duration_minutes: 60,
        },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should reject invalid duration values (e.g. 45 minutes) with 400 Bad Request', async () => {
      const startTime = new Date(Date.now() + 86400000).toISOString();
      const res = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: { cookie: requesterCookie },
        payload: {
          service_offer_id: createdOfferId,
          scheduled_start_time: startTime,
          duration_minutes: 45,
        },
      });

      expect(res.statusCode).toBe(400);
    });
  });

  describe('Booking Retrieval & Authorization', () => {
    it('should return bookings list for authenticated participant', async () => {
      const res = await app.inject({
        method: 'GET',
        url: '/api/v1/bookings?status=upcoming',
        headers: { cookie: requesterCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });

    it('should allow participant to view booking details', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/bookings/${activeBookingId}`,
        headers: { cookie: providerCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.id).toBe(activeBookingId);
    });

    it('should reject non-participant access with 403 Forbidden', async () => {
      const res = await app.inject({
        method: 'GET',
        url: `/api/v1/bookings/${activeBookingId}`,
        headers: { cookie: strangerCookie },
      });

      expect(res.statusCode).toBe(403);
    });
  });

  describe('State Machine Lifecycle & Guard Enforcement', () => {
    it('should reject accept attempt by non-provider (requester) with 403', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/bookings/${activeBookingId}/accept`,
        headers: { cookie: requesterCookie },
      });

      expect(res.statusCode).toBe(403);
    });

    it('should allow provider to accept booking (PENDING_ACCEPTANCE -> CONFIRMED)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/bookings/${activeBookingId}/accept`,
        headers: { cookie: providerCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('CONFIRMED');
    });

    it('should reject duplicate accept on CONFIRMED booking with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/bookings/${activeBookingId}/accept`,
        headers: { cookie: providerCookie },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should allow participant to attest completion (CONFIRMED -> COMPLETED)', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/bookings/${activeBookingId}/attest-completion`,
        headers: { cookie: requesterCookie },
      });

      expect(res.statusCode).toBe(200);
      const json = JSON.parse(res.payload);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('COMPLETED');
    });

    it('should reject cancellation attempt on COMPLETED booking with 400', async () => {
      const res = await app.inject({
        method: 'POST',
        url: `/api/v1/bookings/${activeBookingId}/cancel`,
        headers: { cookie: requesterCookie },
        payload: { cancellation_reason: 'Trying to cancel completed booking' },
      });

      expect(res.statusCode).toBe(400);
    });

    it('should handle decline flow for a pending booking (PENDING_ACCEPTANCE -> CANCELLED)', async () => {
      const startTime = new Date(Date.now() + 172800000).toISOString();
      const createRes = await app.inject({
        method: 'POST',
        url: '/api/v1/bookings',
        headers: { cookie: requesterCookie },
        payload: {
          service_offer_id: createdOfferId,
          scheduled_start_time: startTime,
          duration_minutes: 60,
        },
      });

      const secondBookingId = JSON.parse(createRes.payload).data.id;

      // Provider declines
      const decRes = await app.inject({
        method: 'POST',
        url: `/api/v1/bookings/${secondBookingId}/decline`,
        headers: { cookie: providerCookie },
      });

      expect(decRes.statusCode).toBe(200);
      const json = JSON.parse(decRes.payload);
      expect(json.success).toBe(true);
      expect(json.data.status).toBe('CANCELLED');
      expect(json.data.cancellation_type).toBe('PROVIDER_DECLINED');
    });
  });
});
