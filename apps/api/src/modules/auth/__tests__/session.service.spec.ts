import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SessionService } from '../session.service';
import { prisma } from '@timeswap/database';

describe('SessionService', () => {
  let sessionService: SessionService;
  let testUserId: string;

  beforeEach(async () => {
    sessionService = new SessionService();
    const testUser = await prisma.user.create({
      data: {
        email: `session_test_${Date.now()}@example.com`,
        status: 'ACTIVE',
        role: 'USER',
      },
    });
    testUserId = testUser.id;
  });

  afterEach(async () => {
    if (testUserId) {
      await prisma.user.delete({ where: { id: testUserId } }).catch(() => {});
    }
  });

  it('should create and validate a session token', async () => {
    const session = await sessionService.createSession(testUserId, '127.0.0.1', 'Vitest');
    expect(session.token).toBeDefined();

    const validated = await sessionService.validateSession(session.token);
    expect(validated).not.toBeNull();
    expect(validated?.userId).toBe(testUserId);
  });

  it('should revoke a session token', async () => {
    const session = await sessionService.createSession(testUserId);
    await sessionService.revokeSession(session.token);

    const validated = await sessionService.validateSession(session.token);
    expect(validated).toBeNull();
  });

  it('should revoke all user sessions', async () => {
    const session1 = await sessionService.createSession(testUserId);
    const session2 = await sessionService.createSession(testUserId);

    await sessionService.revokeAllUserSessions(testUserId);

    expect(await sessionService.validateSession(session1.token)).toBeNull();
    expect(await sessionService.validateSession(session2.token)).toBeNull();
  });
});
