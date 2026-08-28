import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { NestFastifyApplication, FastifyAdapter } from '@nestjs/platform-fastify';
import { Test, TestingModule } from '@nestjs/testing';
import fastifyCookie from '@fastify/cookie';
import { AppModule } from '../../../app.module';
import { prisma } from '@timeswap/database';
import { PasswordService } from '../../auth/password.service';

describe('Profiles & Skills E2E', () => {
  let app: NestFastifyApplication;
  let passwordService: PasswordService;

  let testUser1Id: string;
  let testUser1Email = `profile1_${Date.now()}@example.com`;
  let testUser1Cookie: string;

  let testUser2Id: string;
  let testUser2Email = `profile2_${Date.now()}@example.com`;
  let testUser2Cookie: string;

  let categoryId: string;
  let skillId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );

    await app.register(fastifyCookie as any, {
      secret: process.env.COOKIE_SECRET || 'timeswap-dev-cookie-secret-min-32-chars!!',
    });

    app.setGlobalPrefix('api/v1');
    await app.init();
    await app.getHttpAdapter().getInstance().ready();

    passwordService = moduleFixture.get<PasswordService>(PasswordService);

    // Create system reserve account if missing
    await prisma.ledgerAccount.upsert({
      where: { id: '00000000-0000-0000-0000-000000000000' },
      update: {},
      create: {
        id: '00000000-0000-0000-0000-000000000000',
        accountType: 'SYSTEM_RESERVE',
        balance: 1000000.0,
      },
    });

    // Create seed category & skill for testing
    const cat = await prisma.skillCategory.upsert({
      where: { slug: 'test-cat-slug' },
      update: {},
      create: {
        name: 'Test Category',
        slug: 'test-cat-slug',
      },
    });
    categoryId = cat.id;

    const sk = await prisma.skill.upsert({
      where: { slug: 'test-skill-slug' },
      update: {},
      create: {
        categoryId: cat.id,
        name: 'Test Skill',
        slug: 'test-skill-slug',
      },
    });
    skillId = sk.id;

    // Create user 1
    const passwordHash = await passwordService.hashPassword('Password123!');
    const user1 = await prisma.user.create({
      data: {
        email: testUser1Email,
        status: 'UNVERIFIED',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Profile User One',
            handle: `handle_one_${Date.now()}`,
            city: 'San Francisco',
            generalDistrict: 'Mission',
          },
        },
      },
    });
    testUser1Id = user1.id;

    // Create session 1
    const session1 = await prisma.sessionToken.create({
      data: {
        userId: user1.id,
        token: `session_token_1_${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    testUser1Cookie = `timeswap_session=${session1.token}`;

    // Create user 2
    const user2 = await prisma.user.create({
      data: {
        email: testUser2Email,
        status: 'UNVERIFIED',
        credential: { create: { passwordHash } },
        profile: {
          create: {
            displayName: 'Profile User Two',
            handle: `handle_two_${Date.now()}`,
            city: 'New York',
            generalDistrict: 'Manhattan',
          },
        },
      },
    });
    testUser2Id = user2.id;

    const session2 = await prisma.sessionToken.create({
      data: {
        userId: user2.id,
        token: `session_token_2_${Date.now()}`,
        expiresAt: new Date(Date.now() + 86400000),
      },
    });
    testUser2Cookie = `timeswap_session=${session2.token}`;
  });

  afterAll(async () => {
    if (testUser1Id) {
      await prisma.user.delete({ where: { id: testUser1Id } }).catch(() => {});
    }
    if (testUser2Id) {
      await prisma.user.delete({ where: { id: testUser2Id } }).catch(() => {});
    }
    if (app) {
      await app.close();
    }
  });

  it('GET /api/v1/users/me/profile should return current authenticated user profile', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/profile',
      headers: { cookie: testUser1Cookie },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.displayName).toBe('Profile User One');
    expect(body.data.email).toBe(testUser1Email);
    expect(body.data.wallet).toBeDefined();
  });

  it('PATCH /api/v1/users/me/profile should update profile details', async () => {
    const res = await app.inject({
      method: 'PATCH',
      url: '/api/v1/users/me/profile',
      headers: { cookie: testUser1Cookie },
      payload: {
        bio: 'Updated bio for testing profile editing.',
        city: 'Oakland',
        general_district: 'Downtown',
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.bio).toBe('Updated bio for testing profile editing.');
    expect(body.data.city).toBe('Oakland');
  });

  it('GET /api/v1/skills/categories should return taxonomy categories', async () => {
    const res = await app.inject({
      method: 'GET',
      url: '/api/v1/skills/categories',
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  });

  it('POST /api/v1/skills/me/skills & DELETE should attach and remove profile skills', async () => {
    // Attach
    const attachRes = await app.inject({
      method: 'POST',
      url: '/api/v1/skills/me/skills',
      headers: { cookie: testUser1Cookie },
      payload: {
        skill_id: skillId,
        role: 'OFFERED',
      },
    });

    expect(attachRes.statusCode).toBe(201);
    const attachBody = JSON.parse(attachRes.payload);
    expect(attachBody.success).toBe(true);

    // Remove
    const removeRes = await app.inject({
      method: 'DELETE',
      url: `/api/v1/skills/me/skills/${skillId}?role=OFFERED`,
      headers: { cookie: testUser1Cookie },
    });

    expect(removeRes.statusCode).toBe(200);
    const removeBody = JSON.parse(removeRes.payload);
    expect(removeBody.success).toBe(true);
  });

  it('POST /api/v1/users/me/profile/complete should complete onboarding and grant 1.0 starter credit', async () => {
    const uniqueHandle = `unique_handle_${Date.now()}`;
    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/profile/complete',
      headers: { cookie: testUser1Cookie },
      payload: {
        handle: uniqueHandle,
        bio: 'This is a long bio that meets the 30 character requirement for onboarding.',
        city: 'Oakland',
        general_district: 'Downtown',
        delivery_preference: 'BOTH',
        offered_skill_ids: [skillId],
        learning_skill_ids: [skillId],
      },
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.profile_completed).toBe(true);
    expect(body.data.starter_credit_awarded).toBe(1.0);

    // Verify user balance updated to 1.00
    const profileRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/profile',
      headers: { cookie: testUser1Cookie },
    });
    const profileBody = JSON.parse(profileRes.payload);
    expect(profileBody.data.status).toBe('ACTIVE');
    expect(profileBody.data.handle).toBe(uniqueHandle);
    expect(profileBody.data.deliveryPreference).toBe('BOTH');
    expect(profileBody.data.wallet.availableBalance).toBe(1.0);
  });

  it('GET /api/v1/profiles/check-handle should validate handle availability and suggest alternatives if taken', async () => {
    // 1. Available handle check
    const availRes = await app.inject({
      method: 'GET',
      url: '/api/v1/profiles/check-handle?handle=clean_new_handle',
    });
    expect(availRes.statusCode).toBe(200);
    const availBody = JSON.parse(availRes.payload);
    expect(availBody.success).toBe(true);
    expect(availBody.data.available).toBe(true);

    // 2. Taken handle check
    const user1ProfileRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/profile',
      headers: { cookie: testUser1Cookie },
    });
    const takenHandle = JSON.parse(user1ProfileRes.payload).data.handle;

    const takenRes = await app.inject({
      method: 'GET',
      url: `/api/v1/profiles/check-handle?handle=${takenHandle}`,
    });
    expect(takenRes.statusCode).toBe(200);
    const takenBody = JSON.parse(takenRes.payload);
    expect(takenBody.success).toBe(true);
    expect(takenBody.data.available).toBe(false);
    expect(takenBody.data.reason).toBe('HANDLE_TAKEN');
    expect(Array.isArray(takenBody.data.alternatives)).toBe(true);
    expect(takenBody.data.alternatives.length).toBeGreaterThan(0);

    // 3. Less than 4 characters handle check
    const shortRes = await app.inject({
      method: 'GET',
      url: '/api/v1/profiles/check-handle?handle=abc',
    });
    expect(shortRes.statusCode).toBe(200);
    const shortBody = JSON.parse(shortRes.payload);
    expect(shortBody.data.available).toBe(false);
    expect(shortBody.data.reason).toBe('TOO_SHORT');
  });

  it('POST /api/v1/users/me/profile/complete should reject duplicate handle with 409 Conflict', async () => {
    // User 1 completed onboarding with a handle. User 2 tries to use the same handle.
    const user1ProfileRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/profile',
      headers: { cookie: testUser1Cookie },
    });
    const takenHandle = JSON.parse(user1ProfileRes.payload).data.handle;

    const res = await app.inject({
      method: 'POST',
      url: '/api/v1/users/me/profile/complete',
      headers: { cookie: testUser2Cookie },
      payload: {
        handle: takenHandle,
        bio: 'This is another long bio that meets the 30 character requirement.',
        city: 'San Jose',
        general_district: 'Central',
        offered_skill_ids: [skillId],
        learning_skill_ids: [skillId],
      },
    });

    expect(res.statusCode).toBe(409);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('HANDLE_TAKEN');
  });

  it('GET /api/v1/profiles/:handle should return public profile and MASK sensitive data', async () => {
    const user1ProfileRes = await app.inject({
      method: 'GET',
      url: '/api/v1/users/me/profile',
      headers: { cookie: testUser1Cookie },
    });
    const handle = JSON.parse(user1ProfileRes.payload).data.handle;

    const res = await app.inject({
      method: 'GET',
      url: `/api/v1/profiles/${handle}`,
    });

    expect(res.statusCode).toBe(200);
    const body = JSON.parse(res.payload);
    expect(body.success).toBe(true);
    expect(body.data.handle).toBe(handle);
    expect(body.data.display_name).toBe('Profile User One');
    expect(body.data.city).toBe('Oakland');
    expect(body.data.general_district).toBe('Downtown');

    // Data Masking Assertions: Sensitve / confidential credentials MUST NOT be returned!
    expect(body.data.email).toBeUndefined();
    expect(body.data.userId).toBeUndefined();
    expect(body.data.passwordHash).toBeUndefined();
    expect(body.data.credential).toBeUndefined();
    expect(body.data.sessions).toBeUndefined();
    expect(body.data.wallet).toBeUndefined();
  });
});
