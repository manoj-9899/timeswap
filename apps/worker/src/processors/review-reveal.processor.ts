import { prisma, Prisma } from '@timeswap/database';

export class ReviewRevealProcessor {
  /**
   * Scans for single reviews submitted > 7 days ago that remain unrevealed,
   * auto-reveals them, and recalculates profile reputation metrics.
   */
  async processReviewReveals() {
    console.log('[ReviewRevealProcessor] Executing 7-day review reveal audit...');

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const unrevealedReviews = await prisma.review.findMany({
      where: {
        isRevealed: false,
        createdAt: { lte: sevenDaysAgo },
      },
    });

    console.log(`[ReviewRevealProcessor] Found ${unrevealedReviews.length} unrevealed reviews older than 7 days.`);

    let revealedCount = 0;
    for (const review of unrevealedReviews) {
      try {
        await prisma.review.update({
          where: { id: review.id },
          data: { isRevealed: true },
        });

        // Recalculate rating average for subject profile
        await this.recalculateProfileReputation(review.subjectUserId);
        revealedCount++;
        console.log(`[ReviewRevealProcessor] Auto-revealed review ${review.id} for user ${review.subjectUserId}.`);
      } catch (err: any) {
        console.error(`[ReviewRevealProcessor] Failed to reveal review ${review.id}: ${err.message}`);
      }
    }

    return { total_audited: unrevealedReviews.length, revealed_count: revealedCount };
  }

  private async recalculateProfileReputation(userId: string) {
    const reviews = await prisma.review.findMany({
      where: {
        subjectUserId: userId,
        isRevealed: true,
      },
    });

    const count = reviews.length;
    let avg = 0;

    if (count > 0) {
      const sum = reviews.reduce((acc, r) => acc + r.rating, 0);
      avg = Math.round((sum / count) * 100) / 100;
    }

    await prisma.profile.updateMany({
      where: { userId },
      data: {
        ratingAverage: new Prisma.Decimal(avg),
        completedExchangesCount: count,
      },
    });
  }
}
