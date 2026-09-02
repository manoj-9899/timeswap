import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma, DeliveryFormat, ServiceOfferStatus } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service.js';

describe('Disputes & Cancellation Lifecycle (Phase 7 E2E)', () => {
  let app: NestFastifyApplication;
  let userCookie: string;
  let userId: string;
  let providerCookie: string;
  let providerId: string;
  let bookingId: string;
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
        email: `dispute_req_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Dispute Requester',
            handle: `dispute_req_${Date.now()}`,
            city: 'San Francisco',
            generalDistrict: 'Mission',
          },
        },
      },
    });
    userId = reqUser.id;

    const rawTokenReq = `session-dispute-req-${Date.now()}`;
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
        email: `dispute_prov_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Dispute Provider',
            handle: `dispute_prov_${Date.now()}`,
            city: 'San Francisco',
            generalDistrict: 'SoMa',
          },
        },
      },
    });
    providerId = provUser.id;

    const rawTokenProv = `session-dispute-prov-${Date.now()}`;
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

    let cat = await prisma.skillCategory.findFirst({ where: { slug: 'technology-programming' } });
    if (!cat) {
      cat = await prisma.skillCategory.create({
        data: { name: 'Technology & Programming', slug: 'technology-programming' },
      });
    }

    const offer = await prisma.serviceOffer.create({
      data: {
        providerId,
        categoryId: cat.id,
        title: 'Design Workshop',
        description: 'UI Design basics',
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
    sessionId = bookingJson.data.session.id;

    await app.inject({
      method: 'POST',
      url: `/api/v1/bookings/${bookingId}/accept`,
      headers: { cookie: providerCookie },
    });
  });

  afterAll(async () => {
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "messages", "message_threads", "reviews", "dispute_cases", "escrow_holds", "sessions", "bookings", "journal_entries", "ledger_transactions", "service_offers", "help_requests", "profile_skills", "profiles", "users" CASCADE;`);
    if (app) {
      await app.close();
    }
  });

  it('1. POST /api/v1/disputes - opens dispute case for session', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/disputes',
      headers: { cookie: userCookie },
      payload: {
        session_id: sessionId,
        dispute_reason: 'Provider did not arrive at scheduled meeting link',
        evidence_text: 'Waited 15 minutes in room with no response.',
      },
    });

    expect(res.statusCode).toBe(201);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.status).toBe('OPEN');
  });

  it('2. GET /api/v1/disputes/admin/all - fetches dispute cases for moderator console', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/disputes/admin/all',
      headers: { cookie: userCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data.length).toBeGreaterThan(0);
  });

  it('3. POST /api/v1/disputes/:id/resolve - moderator arbitrates FULL_REFUND_REQUESTER', async () => {
    const disputesRes = await app.inject({
      method: 'GET',
      url: '/api/v1/disputes/admin/all',
      headers: { cookie: userCookie },
    });
    const disputesJson = JSON.parse(disputesRes.payload);
    const disputeId = disputesJson.data[0].id;

    const res = await app.inject({
      method: 'POST',
      url: `/api/v1/disputes/${disputeId}/resolve`,
      headers: { cookie: userCookie },
      payload: {
        resolution_outcome: 'FULL_REFUND_REQUESTER',
        resolution_notes: 'Verified non-attendance log; full credit refunded to requester.',
      },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data.status).toBe('RESOLVED');
  });
});
