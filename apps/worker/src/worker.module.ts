import { EmailDispatchProcessor } from './processors/email-dispatch.processor';
import { AutoSettlementProcessor } from './processors/auto-settlement.processor';
import { ReviewRevealProcessor } from './processors/review-reveal.processor';

export class WorkerModule {
  private static emailProcessor: EmailDispatchProcessor;
  private static autoSettlementProcessor: AutoSettlementProcessor;
  private static reviewRevealProcessor: ReviewRevealProcessor;

  static async init() {
    console.log('TimeSwap Worker Daemon initializing...');
    this.emailProcessor = new EmailDispatchProcessor();
    this.emailProcessor.start();

    this.autoSettlementProcessor = new AutoSettlementProcessor();
    this.reviewRevealProcessor = new ReviewRevealProcessor();

    setInterval(async () => {
      try {
        await this.autoSettlementProcessor.processAutoSettlements();
        await this.reviewRevealProcessor.processReviewReveals();
      } catch (err) {
        console.error('Error in background worker loop:', err);
      }
    }, 10 * 60 * 1000); // 10-minute cron loop

    console.log('TimeSwap Worker Daemon, Auto-Settlement & Review-Reveal Schedulers running successfully.');
  }
}
