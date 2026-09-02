import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { Test, TestingModule } from '@nestjs/testing';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma, DeliveryFormat, ServiceOfferStatus } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service.js';

describe('Ledger & Escrow Subsystem (Phase 6 E2E)', () => {
  let app: NestFastifyApplication;
  let userCookie: string;
  let userId: string;
  let providerCookie: string;
  let providerId: string;

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

    // Clean database
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "messages", "message_threads", "reviews", "dispute_cases", "escrow_holds", "sessions", "bookings", "journal_entries", "ledger_transactions", "ledger_accounts", "service_offers", "help_requests", "profile_skills", "profiles", "users" CASCADE;`);

    // Create User A
    const passwordHash = await passwordService.hashPassword('Password123!');
    const userA = await prisma.user.create({
      data: {
        email: `ledger_a_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Ledger Requester',
            handle: `ledger_a_${Date.now()}`,
            city: 'New York',
            generalDistrict: 'Manhattan',
          },
        },
      },
    });
    userId = userA.id;

    const rawTokenA = `session-ledger-a-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: userA.id,
        tokenHash: createHash('sha256').update(rawTokenA).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    userCookie = `timeswap_session=${rawTokenA}`;

    // Grant User A initial starter credit
    const sysAcc = await prisma.ledgerAccount.create({
      data: {
        id: '00000000-0000-0000-0000-000000000001',
        accountType: 'SYSTEM_RESERVE',
        balance: -1000.0,
      },
    });

    const userAcc = await prisma.ledgerAccount.create({
      data: {
        userId: userA.id,
        accountType: 'USER_WALLET',
        balance: 1.0,
      },
    });

    const tx = await prisma.ledgerTransaction.create({
      data: { transactionType: 'ONBOARDING_GRANT' },
    });

    await prisma.journalEntry.create({
      data: { transactionId: tx.id, accountId: sysAcc.id, entryType: 'DEBIT', amount: 1.0 },
    });
    await prisma.journalEntry.create({
      data: { transactionId: tx.id, accountId: userAcc.id, entryType: 'CREDIT', amount: 1.0 },
    });

    // Create User B (Provider)
    const userB = await prisma.user.create({
      data: {
        email: `ledger_b_${Date.now()}@example.com`,
        status: 'ACTIVE',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Ledger Provider',
            handle: `ledger_b_${Date.now()}`,
            city: 'New York',
            generalDistrict: 'Brooklyn',
          },
        },
      },
    });
    providerId = userB.id;

    const rawTokenB = `session-ledger-b-${Date.now()}`;
    await prisma.sessionToken.create({
      data: {
        userId: userB.id,
        tokenHash: createHash('sha256').update(rawTokenB).digest('hex'),
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    providerCookie = `timeswap_session=${rawTokenB}`;
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('1. GET /api/v1/wallet - returns initial starter credit balance (1.00 cr)', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet',
      headers: { cookie: userCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.available_balance).toBe(1.0);
    expect(json.data.escrowed_balance).toBe(0.0);
    expect(json.data.total_balance).toBe(1.0);
  });

  it('2. Starter Credit Single-Issuance Guard - prevents duplicate grant', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/wallet/grant-starter-credit',
      headers: { cookie: userCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.data.message).toBe('Starter credit already granted');
  });

  it('3. Booking Escrow Lock - reserves credits when booking a 60-min session', async () => {
    const cat = await prisma.skillCategory.create({
      data: { name: `Ledger Skill Cat ${Date.now()}`, slug: `cat-ledger-${Date.now()}` },
    });

    const offer = await prisma.serviceOffer.create({
      data: {
        providerId,
        categoryId: cat.id,
        title: 'Financial Accounting Help',
        description: 'Learn double-entry bookkeeping',
        durationMinutes: 60,
        format: DeliveryFormat.ONLINE,
        status: ServiceOfferStatus.PUBLISHED,
      },
    });

    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const bookingRes = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { cookie: userCookie },
      payload: {
        service_offer_id: offer.id,
        scheduled_start_time: tomorrow,
        duration_minutes: 60,
      },
    });

    expect(bookingRes.statusCode).toBe(201);
    const bookingJson = JSON.parse(bookingRes.payload);
    expect(bookingJson.data.credit_amount).toBe(1.0);

    const walletRes = await app.inject({
      method: 'GET',
      url: '/api/v1/wallet',
      headers: { cookie: userCookie },
    });

    const walletJson = JSON.parse(walletRes.payload);
    expect(walletJson.data.available_balance).toBe(0.0);
    expect(walletJson.data.escrowed_balance).toBe(1.0);
    expect(walletJson.data.total_balance).toBe(1.0);
  });

  it('4. Zero-Sum Invariant Test - asserts Sum(Debits) - Sum(Credits) == 0.00 across all journal entries', async () => {
    const journalEntries = await prisma.journalEntry.findMany();
    let totalDebits = 0;
    let totalCredits = 0;

    for (const entry of journalEntries) {
      const amount = Number(entry.amount);
      if (entry.entryType === 'DEBIT') {
        totalDebits += amount;
      } else if (entry.entryType === 'CREDIT') {
        totalCredits += amount;
      }
    }

    expect(totalDebits).toBeCloseTo(totalCredits, 2);
  });

  it('5. Double-Spending Guard - rejects second booking when available balance is 0.00', async () => {
    const cat = await prisma.skillCategory.findFirst();
    const offer = await prisma.serviceOffer.create({
      data: {
        providerId,
        categoryId: cat!.id,
        title: 'Second Offer',
        description: 'Another course',
        durationMinutes: 60,
        format: DeliveryFormat.ONLINE,
        status: ServiceOfferStatus.PUBLISHED,
      },
    });

    const tomorrow = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/bookings',
      headers: { cookie: userCookie },
      payload: {
        service_offer_id: offer.id,
        scheduled_start_time: tomorrow,
        duration_minutes: 60,
      },
    });

    expect(res.statusCode).toBe(400);
    const json = JSON.parse(res.payload);
    expect(json.error.code).toBe('INSUFFICIENT_CREDITS');
  });
});
