import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { FastifyAdapter, NestFastifyApplication } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from '../../../app.module.js';
import { prisma, UserRole, UserStatus, ServiceOfferStatus, HelpRequestStatus, DeliveryFormat } from '@timeswap/database';

describe('Discovery Engine (E2E)', () => {
  let app: NestFastifyApplication;
  let testUserId: string;
  let testCategoryId: string;
  let uniqueKeyword: string;

  beforeAll(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleRef.createNestApplication<NestFastifyApplication>(new FastifyAdapter());
    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    uniqueKeyword = `DiscKey_${Date.now()}`;

    // Setup seed test category & user for discovery testing
    const category = await prisma.skillCategory.upsert({
      where: { slug: 'discovery-test-category' },
      update: {},
      create: {
        name: 'Discovery Test Category',
        slug: 'discovery-test-category',
      },
    });
    testCategoryId = category.id;

    const user = await prisma.user.create({
      data: {
        email: `discovery_${Date.now()}@example.com`,
        role: UserRole.USER,
        status: UserStatus.ACTIVE,
        profile: {
          create: {
            displayName: `Discovery Dev ${uniqueKeyword}`,
            handle: `discdev_${Date.now()}`,
            bio: `Expert developer for ${uniqueKeyword} discovery testing.`,
            city: 'San Francisco',
            generalDistrict: 'Mission District',
            deliveryPreference: DeliveryFormat.BOTH,
          },
        },
      },
      include: { profile: true },
    });
    testUserId = user.id;

    // Create test Service Offer
    await prisma.serviceOffer.create({
      data: {
        providerId: testUserId,
        categoryId: testCategoryId,
        title: `Advanced ${uniqueKeyword} Service Offer`,
        description: `Comprehensive 1-on-1 mentorship session for ${uniqueKeyword}.`,
        durationMinutes: 60,
        format: DeliveryFormat.ONLINE,
        city: 'San Francisco',
        generalDistrict: 'Mission District',
        status: ServiceOfferStatus.PUBLISHED,
      },
    });

    // Create test Help Request
    await prisma.helpRequest.create({
      data: {
        requesterId: testUserId,
        categoryId: testCategoryId,
        title: `Need Help Debugging ${uniqueKeyword} Request`,
        description: `Looking for a senior engineer for ${uniqueKeyword}.`,
        targetDuration: 30,
        preferredFormat: DeliveryFormat.ONLINE,
        city: 'San Francisco',
        generalDistrict: 'Mission District',
        urgency: 'THIS_WEEK',
        status: HelpRequestStatus.OPEN,
      },
    });
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/discovery/offers - should return paginated list of published offers', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/discovery/offers?page=1&limit=10',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('items');
    expect(body.data).toHaveProperty('total');
    expect(body.data).toHaveProperty('page', 1);
    expect(body.data).toHaveProperty('totalPages');
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it('GET /api/v1/discovery/offers?q=DiscKey - should filter offers by keyword search', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/discovery/offers?q=${uniqueKeyword}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items[0].title).toContain(uniqueKeyword);
  });

  it('GET /api/v1/discovery/requests - should return paginated list of open help requests', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/discovery/requests?page=1&limit=10',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('items');
    expect(Array.isArray(body.data.items)).toBe(true);
  });

  it('GET /api/v1/discovery/requests?q=DiscKey - should filter requests by keyword', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/discovery/requests?q=${uniqueKeyword}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);
    expect(body.data.items[0].title).toContain(uniqueKeyword);
  });

  it('GET /api/v1/discovery/members - should return public community profiles without credentials', async () => {
    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/discovery/members?q=${uniqueKeyword}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data).toHaveProperty('items');
    expect(Array.isArray(body.data.items)).toBe(true);
    expect(body.data.items.length).toBeGreaterThan(0);

    const firstMember = body.data.items[0];
    expect(firstMember).toHaveProperty('display_name');
    expect(firstMember).toHaveProperty('handle');
    expect(firstMember).not.toHaveProperty('email');
    expect(firstMember).not.toHaveProperty('passwordHash');
  });
});
