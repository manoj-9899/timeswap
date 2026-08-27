import { prisma, EscrowStatus } from '@timeswap/database';

export class AutoSettlementProcessor {
  /**
   * Scans for completed sessions where 24 hours have elapsed without dispute,
   * and automatically settles escrow to the provider.
   */
  async processAutoSettlements() {
    console.log('[AutoSettlementProcessor] Executing 24-hour auto-settlement audit...');

    const cutoffTime = new Date(Date.now() - 24 * 60 * 60 * 1000);

    const eligibleSessions = await prisma.session.findMany({
      where: {
        autoSettleAt: { lte: new Date() },
        booking: {
          status: { in: ['COMPLETED', 'IN_PROGRESS', 'CONFIRMED'] },
          escrowHold: {
            status: 'HELD' as EscrowStatus,
          },
        },
        OR: [
          { disputeCase: null },
          { disputeCase: { isNot: { status: 'OPEN' } } },
        ],
      },
      include: {
        booking: {
          include: {
            escrowHold: true,
          },
        },
      },
    });

    console.log(`[AutoSettlementProcessor] Found ${eligibleSessions.length} sessions eligible for auto-settlement.`);

    let settledCount = 0;
    for (const session of eligibleSessions) {
      const booking = session.booking;
      if (!booking || !booking.escrowHold) continue;

      try {
        await prisma.$transaction(async (tx) => {
          const providerAccount = await tx.ledgerAccount.findUnique({
            where: { userId: booking.providerId },
          });

          if (!providerAccount) return;

          const creditAmount = Number(booking.creditAmount);

          const transaction = await tx.ledgerTransaction.create({
            data: {
              transactionType: 'ESCROW_SETTLEMENT',
              bookingId: booking.id,
            },
          });

          await tx.journalEntry.create({
            data: {
              transactionId: transaction.id,
              accountId: providerAccount.id,
              entryType: 'CREDIT',
              amount: creditAmount,
            },
          });

          await tx.ledgerAccount.update({
            where: { id: providerAccount.id },
            data: { balance: { increment: creditAmount } },
          });

          await tx.escrowHold.update({
            where: { id: booking.escrowHold!.id },
            data: { status: 'SETTLED' },
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: { status: 'COMPLETED' },
          });
        });

        settledCount++;
        console.log(`[AutoSettlementProcessor] Auto-settled booking ${booking.id} (${booking.creditAmount} cr).`);
      } catch (err: any) {
        console.error(`[AutoSettlementProcessor] Failed auto-settlement for booking ${booking.id}: ${err.message}`);
      }
    }

    return { total_audited: eligibleSessions.length, settled_count: settledCount };
  }
}
