import { Injectable } from '@nestjs/common';
import { prisma } from '@timeswap/database';
import { randomBytes, createHash } from 'crypto';

@Injectable()
export class SessionService {
  private readonly SESSION_DURATION_DAYS = 7;

  /**
   * Hashes a raw session token using SHA-256 for secure database lookup.
   */
  private hashToken(rawToken: string): string {
    return createHash('sha256').update(rawToken).digest('hex');
  }

  /**
   * Creates a new session token for the user in PostgreSQL datastore.
   * Stores the SHA-256 hash in the database and returns the raw token for HTTP cookie header.
   */
  async createSession(userId: string, ipAddress?: string, userAgent?: string) {
    const rawToken = randomBytes(32).toString('hex');
    const tokenHash = this.hashToken(rawToken);
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.SESSION_DURATION_DAYS);

    const session = await prisma.sessionToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt,
        ipAddress,
        userAgent,
      },
    });

    return {
      ...session,
      rawToken,
    };
  }

  /**
   * Validates a raw session token, returning the full user with profile if valid.
   */
  async validateSession(rawToken: string) {
    if (!rawToken) return null;

    const tokenHash = this.hashToken(rawToken);

    const session = await prisma.sessionToken.findUnique({
      where: { tokenHash },
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
   * Deletes a single session token by hashing incoming raw token (e.g. on logout).
   */
  async revokeSession(rawToken: string) {
    if (!rawToken) return;
    const tokenHash = this.hashToken(rawToken);
    await prisma.sessionToken.deleteMany({
      where: { tokenHash },
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
