import { Injectable } from '@nestjs/common';
import { prisma } from '@timeswap/database';
import { randomBytes } from 'crypto';

@Injectable()
export class SessionService {
  private readonly SESSION_DURATION_DAYS = 7;

  /**
   * Creates a new session token for the user in PostgreSQL datastore.
   */
  async createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const token = randomBytes(32).toString('hex');
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);

    const session = await prisma.sessionToken.create({
      data: {
        userId,
        token,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return session;
  }

  /**
   * Validates a session token, returning the full user with profile if valid.
   */
  async validateSession(token: string) {
    if (!token) return null;

    const session = await prisma.sessionToken.findUnique({
      where: { token },
      include: {
        user: {
          include: {
            profile: true,
          },
        },
      },
    });

    if (!session) return null;

    // Check expiration
    if (new Date() > session.expiresAt) {
      await prisma.sessionToken.delete({ where: { id: session.id } }).catch(() => {});
      return null;
    }

    return session;
  }

  /**
   * Deletes a single session token (e.g. on logout).
   */
  async revokeSession(token: string) {
    if (!token) return;
    await prisma.sessionToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Revokes all active sessions for a user (e.g. on password reset).
   */
  async revokeAllUserSessions(userId: string) {
    await prisma.sessionToken.deleteMany({
      where: { userId },
    });
  }
}
