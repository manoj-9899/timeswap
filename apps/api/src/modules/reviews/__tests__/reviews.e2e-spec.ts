import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma, DeliveryFormat, ServiceOfferStatus } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service.js';

describe('Double-Blind Reviews Subsystem (Phase 8 E2E)', () => {
  let app: NestFastifyApplication;
  let userCookie: string;
  let providerCookie: string;
  let providerHandle: string;
  let sessionId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    await app.register(fastifyCookie as any, {
      secret: process.env.COOKIE_SECRET || 'timeswap-dev-cookie-secret-min-32-chars!!',
    });
    app.setGlobalPrefix('api/v1');
    const passwordService = moduleFixture.get<PasswordService>(PasswordService);

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "messages", "message_threads", "reviews", "dispute_cases", "escrow_holds", "sessions", "bookings", "journal_entries", "ledger_transactions", "ledger_accounts", "service_offers", "help_requests", "profile_skills", "profiles", "users" CASCADE;`);

    const passwordHash = await passwordService.hashPassword('Password123!');
    const reqUser = await prisma.user.create({
      data: {
        email: `rev_req_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Review Requester',
            handle: `rev_req_${Date.now()}`,
            city: 'Austin',
            generalDistrict: 'Downtown',
          },
        },
      },
    });

    const rawTokenReq = `session-rev-req-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: reqUser.id,
        tokenHash: createHash('sha256').update(rawTokenReq).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    userCookie = `timeswap_session=${rawTokenReq}`;

    const provUser = await prisma.user.create({
      data: {
        email: `rev_prov_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Review Provider',
            handle: `rev_prov_${Date.now()}`,
            city: 'Austin',
            generalDistrict: 'East Austin',
          },
        },
      },
    });

    const provProfile = await prisma.profile.findUnique({
      where: { userId: provUser.id },
    });
    providerHandle = provProfile!.handle;

    const rawTokenProv = `session-rev-prov-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: provUser.id,
        tokenHash: createHash('sha256').update(rawTokenProv).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    providerCookie = `timeswap_session=${rawTokenProv}`;

    // Grant credits to Requester
    const sysAcc = await prisma.ledgerAccount.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        accountType: 'SYSTEM_RESERVE',
        balance: -1000.0,
      },
    });
    const reqAcc = await prisma.ledgerAccount.create({
      data: {
        userId: reqUser.id,
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

    const cat = await prisma.skillCategory.create({
      data: { name: `Review Skill ${Date.now()}`, slug: `cat-review-${Date.now()}` },
    });

    const offer = await prisma.serviceOffer.create({
      data: {
        providerId: provUser.id,
        categoryId: cat.id,
        title: 'Guitar Masterclass',
        description: 'Acoustic guitar basics',
        durationMinutes: 60,
        format: DeliveryFormat.ONLINE,
        status: ServiceOfferStatus.PUBLISHED,
      },
    });

    const bookingRes = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { cookie: userCookie },
      payload: {
        service_offer_id: offer.id,
        scheduled_start_time: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
        duration_minutes: 60,
      },
    });

    const bookingJson = JSON.parse(bookingRes.payload);
    const bookingId = bookingJson.data.id;
    sessionId = bookingJson.data.session.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${bookingId}/accept`,
      headers: { cookie: providerCookie },
    });

    // Complete session
    await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${bookingId}/attest-completion`,
      headers: { cookie: userCookie },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. First review submission - remains hidden (is_revealed: false)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: { cookie: userCookie },
      payload: {
        session_id: sessionId,
        rating: 5,
        comment_text: 'Excellent session, learned a lot!',
      },
    });

    if (res.statusCode !== 201) {
      console.log('REVIEWS TEST 1 ERROR PAYLOAD:', res.payload);
    }
    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.data.is_revealed).toBe(false);
  });

  it('2. GET /api/v1/reviews/profile/:handle - returns zero revealed reviews prior to bilateral submission', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/profile/${providerHandle}`,
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data.reviews.length).toBe(0);
  });

  it('3. Counterpart review submission - reveals both reviews (is_revealed: true)', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/reviews',
      headers: { cookie: providerCookie },
      payload: {
        session_id: sessionId,
        rating: 5,
        comment_text: 'Great student, very attentive!',
      },
    });

    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.data.is_revealed).toBe(true);

    // Verify reviews are now visible on profile
    const feedRes = await app.inject({
      method: 'GET',
      url: `/api/v1/reviews/profile/${providerHandle}`,
    });

    const feedJson = JSON.parse(feedRes.payload);
    expect(feedJson.data.reviews.length).toBe(1);
    expect(feedJson.data.rating_average).toBe(5);
  });
});
