import { Worker, Job } from 'bullmq';
import * as nodemailer from 'nodemailer';
import { renderVerificationEmail, renderPasswordResetEmail } from '../templates/email-templates';

export interface EmailJobData {
  email: string;
  token: string;
  link: string;
}

export class EmailDispatchProcessor {
  private worker: Worker | null = null;
  private smtpTransporter: nodemailer.Transporter | null = null;

  start() {
    const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
    const url = new URL(redisUrl);

    // Initialize SMTP Transporter if SMTP host/user are configured
    const smtpHost = process.env.SMTP_HOST;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpPort = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : 587;

    if (smtpHost && smtpUser && smtpPass && smtpHost !== 'localhost') {
      try {
        this.smtpTransporter = nodemailer.createTransport({
          host: smtpHost,
          port: smtpPort,
          secure: smtpPort === 465,
          auth: {
            user: smtpUser,
            pass: smtpPass,
          },
        });
        console.log(`[EmailWorker] Initialized Nodemailer SMTP transport (${smtpHost}:${smtpPort}) for universal dispatch to any inbox!`);
      } catch (err: any) {
        console.error('[EmailWorker] Failed to initialize Nodemailer SMTP transporter:', err.message);
      }
    }

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
    const fromAddress = process.env.EMAIL_FROM || process.env.SMTP_USER || 'TimeSwap <onboarding@resend.dev>';

    // Priority 1: Direct SMTP (Gmail App Password, Brevo, Custom SMTP) -> Sends to ANY email address automatically!
    if (this.smtpTransporter) {
      try {
        const info = await this.smtpTransporter.sendMail({
          from: fromAddress,
          to: params.to,
          subject: params.subject,
          html: params.html,
        });
        console.log(`[EmailWorker] 🎉 Universal Email sent via SMTP to ${params.to}! Message ID: ${info.messageId}`);
        return;
      } catch (err: any) {
        console.error(`[EmailWorker] Failed to dispatch via SMTP to ${params.to}:`, err.message);
      }
    }

    // Priority 2: Resend API
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
      console.log(`(Set SMTP_USER & SMTP_PASS or RESEND_API_KEY in .env to dispatch live emails to real inboxes)`);
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
