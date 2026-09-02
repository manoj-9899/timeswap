import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { createHash } from 'crypto';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module.js';
import { prisma } from '@timeswap/database';

describe('NotificationsModule (E2E)', () => {
  let app: NestFastifyApplication;

  let testUserId: string;
  let testUserCookie: string;
  let otherUserId: string;
  let notif1Id: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());

    await app.register(fastifyCookie as any, {
      secret: process.env.COOKIE_SECRET || 'timeswap-dev-cookie-secret-min-32-chars!!',
    });

    app.setGlobalPrefix('api/v1');

    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    // Clean notifications
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "notifications" CASCADE;`);

    // Create Test User
    const user = await prisma.user.create({
      data: {
        email: `notif_user_${Date.now()}@example.com`,
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Notif Test User',
            handle: `notif_u_${Date.now()}`,
            city: 'Mumbai',
            generalDistrict: 'Andheri',
          },
        },
      },
    });
    testUserId = user.id;

    const rawToken = `session-notif-${Date.now()}`;
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    await prisma.sessionToken.create({
      data: {
        userId: testUserId,
        tokenHash,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    testUserCookie = `timeswap_session=${rawToken}`;

    // Create Other User for isolation check
    const other = await prisma.user.create({
      data: {
        email: `other_notif_${Date.now()}@example.com`,
        status: 'ACTIVE',
        profile: {
          create: {
            displayName: 'Other User',
            handle: `other_u_${Date.now()}`,
            city: 'Mumbai',
            generalDistrict: 'Bandra',
          },
        },
      },
    });
    otherUserId = other.id;

    // Insert test notifications
    const n1 = await prisma.notification.create({
      data: {
        userId: testUserId,
        notificationType: 'BOOKING_REQUESTED',
        title: 'New Booking Request',
        bodyText: 'Alice requested a session.',
        actionUrl: '/bookings/b-123',
        isRead: false,
      },
    });
    notif1Id = n1.id;

    await prisma.notification.create({
      data: {
        userId: testUserId,
        notificationType: 'STARTER_GRANT_RECEIVED',
        title: 'Starter Credit Received',
        bodyText: '1.0 Time Credit awarded.',
        actionUrl: '/wallet',
        isRead: false,
      },
    });

    // Notification for other user (should be isolated)
    await prisma.notification.create({
      data: {
        userId: otherUserId,
        notificationType: 'BOOKING_CONFIRMED',
        title: 'Other User Notification',
        bodyText: 'Isolated test.',
        isRead: false,
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/notifications should return user notification feed & unread count', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
      headers: { cookie: testUserCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.items).toHaveLength(2);
    expect(json.data.unread_count).toBe(2);
    expect(json.data.items[0].title).toBeDefined();
  });

  it('GET /api/v1/notifications/unread-count should return unread count metric', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
      headers: { cookie: testUserCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.unread_count).toBe(2);
  });

  it('PATCH /api/v1/notifications/:id/read should mark single notification as read', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: `/api/v1/notifications/${notif1Id}/read`,
      headers: { cookie: testUserCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.is_read).toBe(true);

    // Verify unread count updated to 1
    const countRes = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
      headers: { cookie: testUserCookie },
    });
    expect(JSON.parse(countRes.payload).data.unread_count).toBe(1);
  });

  it('POST /api/v1/notifications/read-all should mark all user notifications as read', async () => {
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/notifications/read-all',
      headers: { cookie: testUserCookie },
    });

    expect(res.statusCode).toBe(200);
    const json = JSON.parse(res.payload);
    expect(json.success).toBe(true);
    expect(json.data.updated_count).toBe(1);

    // Verify unread count is now 0
    const countRes = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications/unread-count',
      headers: { cookie: testUserCookie },
    });
    expect(JSON.parse(countRes.payload).data.unread_count).toBe(0);
  });

  it('GET /api/v1/notifications without session cookie should return 401 Unauthorized', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/notifications',
    });

    expect(res.statusCode).toBe(401);
  });
});
