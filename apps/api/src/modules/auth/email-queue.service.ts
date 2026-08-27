import { Injectable, Logger } from '@nestjs/common';
import { Queue } from 'bullmq';

@Injectable()
export class EmailQueueService {
  private readonly logger = new Logger(EmailQueueService.name);
  private queue: Queue | null = null;

  constructor() {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const url = new URL(redisUrl);
      this.queue = new Queue('email-queue', {
        connection: {
          host: url.hostname || 'localhost',
          port: url.port ? parseInt(url.port, 10) : 6379,
        },
      });
    } catch (error) {
      this.logger.warn(`Could not connect to Redis for EmailQueueService: ${error}`);
    }
  }

  async sendVerificationEmail(email: string, token: string) {
    const link = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/verify-email?token=${token}`;
    this.logger.log(`Dispatching verification email to ${email} (token: ${token})`);

    if (this.queue) {
      await this.queue.add('VERIFICATION_EMAIL', { email, token, link }).catch((err) => {
        this.logger.error(`Failed to add verification email to queue: ${err.message}`);
      });
    }
  }

  async sendPasswordResetEmail(email: string, token: string) {
    const link = `${process.env.CORS_ORIGIN || 'http://localhost:3000'}/reset-password?token=${token}`;
    this.logger.log(`Dispatching password reset email to ${email} (token: ${token})`);

    if (this.queue) {
      await this.queue.add('PASSWORD_RESET_EMAIL', { email, token, link }).catch((err) => {
        this.logger.error(`Failed to add password reset email to queue: ${err.message}`);
      });
    }
  }
}
