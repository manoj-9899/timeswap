import { Worker, Job } from 'bullmq';
import { renderVerificationEmail, renderPasswordResetEmail } from '../templates/email-templates';

export interface EmailJobData {
  email: string;
  token: string;
  link: string;
}

export class EmailDispatchProcessor {
  private worker: Worker | null = null;

  start() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(redisUrl);

    this.worker = new Worker(
      'email-queue',
      async (job: Job<EmailJobData>) => {
        console.log(`[EmailWorker] Processing job ${job.name} (ID: ${job.id}) for ${job.data.email}`);
        
        switch (job.name) {
          case 'VERIFICATION_EMAIL':
            await this.handleVerificationEmail(job.data);
            break;
          case 'PASSWORD_RESET_EMAIL':
            await this.handlePasswordResetEmail(job.data);
            break;
          default:
            console.warn(`[EmailWorker] Unknown job type: ${job.name}`);
        }
      },
      {
        connection: {
          host: url.hostname || 'localhost',
          port: url.port ? parseInt(url.port, 10) : 6379,
        },
      },
    );

    this.worker.on('completed', (job) => {
      console.log(`[EmailWorker] Job ${job.id} (${job.name}) delivered successfully.`);
    });

    this.worker.on('failed', (job, err) => {
      console.error(`[EmailWorker] Job ${job?.id} (${job?.name}) failed:`, err.message);
    });

    console.log('[EmailWorker] Listening for incoming transactional email jobs on BullMQ email-queue...');
  }

  private async sendEmail(params: { to: string; subject: string; html: string }) {
    const apiKey = process.env.RESEND_API_KEY;
    const fromAddress = process.env.EMAIL_FROM || 'TimeSwap <onboarding@resend.dev>';

    if (apiKey && apiKey !== 're_dev_placeholder') {
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            from: fromAddress,
            to: [params.to],
            subject: params.subject,
            html: params.html,
          }),
        });

        if (!response.ok) {
          const errText = await response.text();
          console.error(`[EmailWorker] Resend API error (${response.status}):`, errText);
        } else {
          const resData = (await response.json()) as { id?: string };
          console.log(`[EmailWorker] Email sent via Resend API! Message ID: ${resData.id}`);
        }
      } catch (err: any) {
        console.error('[EmailWorker] Failed to dispatch via Resend REST API:', err.message);
      }
    } else {
      console.log('====================================================');
      console.log(`📧 [LOCAL EMAIL DISPATCH LOG]`);
      console.log(`From: ${fromAddress}`);
      console.log(`To: ${params.to}`);
      console.log(`Subject: ${params.subject}`);
      console.log(`(Set RESEND_API_KEY in .env to dispatch live emails to real inboxes)`);
      console.log('====================================================');
    }
  }

  private async handleVerificationEmail(data: EmailJobData) {
    const htmlContent = renderVerificationEmail(data.link, data.email);
    await this.sendEmail({
      to: data.email,
      subject: 'Verify your TimeSwap Account',
      html: htmlContent,
    });
  }

  private async handlePasswordResetEmail(data: EmailJobData) {
    const htmlContent = renderPasswordResetEmail(data.link, data.email);
    await this.sendEmail({
      to: data.email,
      subject: 'Reset your TimeSwap Password',
      html: htmlContent,
    });
  }

  async close() {
    if (this.worker) {
      await this.worker.close();
    }
  }
}
