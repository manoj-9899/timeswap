import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma, DeliveryFormat, ServiceOfferStatus } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service.js';

describe('Gated Direct Messaging Subsystem (Phase 9 E2E)', () => {
  let app: NestFastifyApplication;
  let userCookie: string;
  let providerCookie: string;
  let strangerCookie: string;
  let bookingId: string;
  let threadId: string;

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
        email: `msg_req_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Message Requester',
            handle: `msg_req_${Date.now()}`,
            city: 'Seattle',
            generalDistrict: 'Capitol Hill',
          },
        },
      },
    });

    const sReq = await prisma.sessionToken.create({
      data: {
        userId: reqUser.id,
        token: `session-msg-req-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    userCookie = `timeswap_session=${sReq.token}`;

    const provUser = await prisma.user.create({
      data: {
        email: `msg_prov_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Message Provider',
            handle: `msg_prov_${Date.now()}`,
            city: 'Seattle',
            generalDistrict: 'Ballard',
          },
        },
      },
    });

    const sProv = await prisma.sessionToken.create({
      data: {
        userId: provUser.id,
        token: `session-msg-prov-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    providerCookie = `timeswap_session=${sProv.token}`;

    const strangerUser = await prisma.user.create({
      data: {
        email: `stranger_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Stranger Danger',
            handle: `stranger_${Date.now()}`,
            city: 'Seattle',
            generalDistrict: 'Downtown',
          },
        },
      },
    });

    const sStranger = await prisma.sessionToken.create({
      data: {
        userId: strangerUser.id,
        token: `session-stranger-${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    strangerCookie = `timeswap_session=${sStranger.token}`;

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
      data: { name: `Msg Skill ${Date.now()}`, slug: `cat-msg-${Date.now()}` },
    });

    const offer = await prisma.serviceOffer.create({
      data: {
        providerId: provUser.id,
        categoryId: cat.id,
        title: 'Spanish Conversation',
        description: 'Practice spoken Spanish',
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
    bookingId = bookingJson.data.id;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. GET /api/v1/messages/booking/:bookingId - creates/fetches gated thread for participants', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/messages/booking/${bookingId}`,
      headers: { cookie: userCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data.booking_id).toBe(bookingId);
    threadId = json.data.id;
  });

  it('2. POST /api/v1/messages/threads/:id/messages - participant sends message', async () => {
    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/messages/threads/${threadId}/messages`,
      headers: { cookie: userCookie },
      payload: {
        content_text: 'Hi! Looking forward to our Spanish session.',
      },
    });

    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.data.content_text).toBe('Hi! Looking forward to our Spanish session.');
  });

  it('3. Cold Outreach Prevention - stranger is forbidden from accessing or messaging thread', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/messages/booking/${bookingId}`,
      headers: { cookie: strangerCookie },
    });

    expect(res.statusCode).toBe(403);
    const json = JSON.parse(res.payload);
    expect(json.error.code).toBe('FORBIDDEN_RESOURCE');
  });
});
