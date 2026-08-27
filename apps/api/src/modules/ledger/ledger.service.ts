import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { prisma, LedgerAccountType, EntryType, EscrowStatus, BookingStatus } from '@timeswap/database';

export const SYSTEM_RESERVE_ACCOUNT_ID = '00000000-0000-0000-0000-000000000001';

@Injectable()
export class LedgerService {
  /**
   * Ensures system reserve ledger account exists.
   */
  async ensureSystemReserveAccount() {
    let systemAcc = await prisma.ledgerAccount.findFirst({
      where: { accountType: 'SYSTEM_RESERVE' as LedgerAccountType },
    });

    if (!systemAcc) {
      systemAcc = await prisma.ledgerAccount.create({
        data: {
          id: SYSTEM_RESERVE_ACCOUNT_ID,
          accountType: 'SYSTEM_RESERVE' as LedgerAccountType,
          balance: -1000.0,
        },
      });
    }

    return systemAcc;
  }

  /**
   * Gets or creates user wallet account.
   */
  async getOrCreateUserAccount(userId: string, tx: any = prisma) {
    let account = await tx.ledgerAccount.findUnique({
      where: { userId },
    });

    if (!account) {
      account = await tx.ledgerAccount.create({
        data: {
          userId,
          accountType: 'USER_WALLET' as LedgerAccountType,
          balance: 0.0,
        },
      });
    }

    return account;
  }

  /**
   * Grants starter credit of 1.00 credit to user upon onboarding.
   */
  async grantStarterCredit(userId: string) {
    const systemAcc = await this.ensureSystemReserveAccount();

    return await prisma.$transaction(async (tx) => {
      // Check if user already received grant
      const existingGrant = await tx.ledgerTransaction.findFirst({
        where: {
          transactionType: 'ONBOARDING_GRANT',
          journalEntries: {
            some: {
              account: { userId },
            },
          },
        },
      });

      if (existingGrant) {
        return { message: 'Starter credit already granted' };
      }

      const userAccount = await this.getOrCreateUserAccount(userId, tx);

      // Create Ledger Transaction
      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: 'ONBOARDING_GRANT',
        },
      });

      // Debit System Reserve
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: systemAcc.id,
          entryType: 'DEBIT' as EntryType,
          amount: 1.0,
        },
      });

      // Credit User Wallet
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: userAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: 1.0,
        },
      });

      // Update cached balance
      const updatedUserAcc = await tx.ledgerAccount.update({
        where: { id: userAccount.id },
        data: {
          balance: { increment: 1.0 },
        },
      });

      return {
        success: true,
        granted_amount: 1.0,
        new_balance: Number(updatedUserAcc.balance),
      };
    });
  }

  /**
   * Locks credits in escrow for a booking using SELECT ... FOR UPDATE.
   */
  async lockEscrow(requesterId: string, bookingId: string, creditAmount: number) {
    return await prisma.$transaction(async (tx) => {
      const userAccount = await this.getOrCreateUserAccount(requesterId, tx);

      // Acquire exclusive row lock
      const lockedAccounts: any[] = await tx.$queryRaw`
        SELECT * FROM "ledger_accounts" WHERE "id" = ${userAccount.id} FOR UPDATE;
      `;

      const currentBalance = Number(lockedAccounts[0]?.balance || 0);

      // Verify balance invariant: available >= creditAmount
      if (currentBalance < creditAmount) {
        throw new BadRequestException({
          code: 'INSUFFICIENT_CREDITS',
          message: `Insufficient credit balance. Required: ${creditAmount}, Available: ${currentBalance}`,
        });
      }

      // Create Ledger Transaction
      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: 'BOOKING_ESCROW_LOCK',
          bookingId,
        },
      });

      // Create Escrow Hold Account
      const escrowAccount = await tx.ledgerAccount.create({
        data: {
          accountType: 'ESCROW_HOLD' as LedgerAccountType,
          balance: creditAmount,
        },
      });

      // Debit Requester Wallet
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: userAccount.id,
          entryType: 'DEBIT' as EntryType,
          amount: creditAmount,
        },
      });

      // Credit Escrow Hold Account
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: escrowAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: creditAmount,
        },
      });

      // Create Escrow Hold Entity
      const escrowHold = await tx.escrowHold.create({
        data: {
          bookingId,
          amount: creditAmount,
          status: 'HELD' as EscrowStatus,
        },
      });

      // Decrement User Wallet cached balance
      await tx.ledgerAccount.update({
        where: { id: userAccount.id },
        data: { balance: { decrement: creditAmount } },
      });

      return escrowHold;
    });
  }

  /**
   * Settles escrow hold to Provider's wallet.
   */
  async settleEscrow(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { escrowHold: true },
      });

      if (!booking || !booking.escrowHold) {
        throw new NotFoundException('Booking or escrow hold not found');
      }

      if (booking.escrowHold.status !== 'HELD') {
        throw new BadRequestException(`Escrow hold is not active (Status: ${booking.escrowHold.status})`);
      }

      const creditAmount = Number(booking.escrowHold.amount);
      const providerAccount = await this.getOrCreateUserAccount(booking.providerId, tx);

      // Create Ledger Transaction
      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: 'SESSION_SETTLEMENT',
          bookingId,
        },
      });

      // Find Escrow Account
      const escrowAccount = await tx.ledgerAccount.findFirst({
        where: { accountType: 'ESCROW_HOLD' as LedgerAccountType, balance: creditAmount },
      });

      if (escrowAccount) {
        // Debit Escrow
        await tx.journalEntry.create({
          data: {
            transactionId: transaction.id,
            accountId: escrowAccount.id,
            entryType: 'DEBIT' as EntryType,
            amount: creditAmount,
          },
        });
      }

      // Credit Provider Wallet
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: providerAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: creditAmount,
        },
      });

      // Increment Provider cached balance
      await tx.ledgerAccount.update({
        where: { id: providerAccount.id },
        data: { balance: { increment: creditAmount } },
      });

      // Update Escrow Hold Status
      await tx.escrowHold.update({
        where: { id: booking.escrowHold.id },
        data: { status: 'SETTLED' as EscrowStatus },
      });

      // Update Booking Status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'COMPLETED' as BookingStatus },
      });

      return { success: true, settled_amount: creditAmount };
    });
  }

  /**
   * Refunds escrow hold to Requester's wallet.
   */
  async refundEscrow(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { escrowHold: true },
      });

      if (!booking || !booking.escrowHold) {
        throw new NotFoundException('Booking or escrow hold not found');
      }

      if (booking.escrowHold.status !== 'HELD') {
        throw new BadRequestException(`Escrow hold is not active (Status: ${booking.escrowHold.status})`);
      }

      const creditAmount = Number(booking.escrowHold.amount);
      const requesterAccount = await this.getOrCreateUserAccount(booking.requesterId, tx);

      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: 'CANCELLATION_REFUND',
          bookingId,
        },
      });

      // Credit Requester Wallet
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: requesterAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: creditAmount,
        },
      });

      // Increment Requester cached balance
      await tx.ledgerAccount.update({
        where: { id: requesterAccount.id },
        data: { balance: { increment: creditAmount } },
      });

      // Update Escrow Status
      await tx.escrowHold.update({
        where: { id: booking.escrowHold.id },
        data: { status: 'REFUNDED' as EscrowStatus },
      });

      // Update Booking Status
      await tx.booking.update({
        where: { id: bookingId },
        data: { status: 'CANCELLED' as BookingStatus },
      });

      return { success: true, refunded_amount: creditAmount };
    });
  }

  /**
   * Transfers escrow to Provider as indemnity for late Requester cancellation.
   */
  async indemnifyProvider(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { escrowHold: true },
      });

      if (!booking || !booking.escrowHold) {
        throw new NotFoundException('Booking or escrow hold not found');
      }

      if (booking.escrowHold.status !== 'HELD') {
        throw new BadRequestException(`Escrow hold is not active (Status: ${booking.escrowHold.status})`);
      }

      const creditAmount = Number(booking.escrowHold.amount);
      const providerAccount = await this.getOrCreateUserAccount(booking.providerId, tx);

      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: 'LATE_CANCELLATION_INDEMNITY',
          bookingId,
        },
      });

      // Credit Provider Wallet
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: providerAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: creditAmount,
        },
      });

      await tx.ledgerAccount.update({
        where: { id: providerAccount.id },
        data: { balance: { increment: creditAmount } },
      });

      await tx.escrowHold.update({
        where: { id: booking.escrowHold.id },
        data: { status: 'SETTLED' as EscrowStatus },
      });

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED' as BookingStatus,
          cancellationType: 'LATE_REQUESTER_CANCELLATION_INDEMNITY',
        },
      });

      return { success: true, indemnity_amount: creditAmount };
    });
  }

  /**
   * Splits escrow 50/50 between Requester and Provider.
   */
  async resolveDisputeSplit(bookingId: string) {
    return await prisma.$transaction(async (tx) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { escrowHold: true },
      });

      if (!booking || !booking.escrowHold) {
        throw new NotFoundException('Booking or escrow hold not found');
      }

      if (booking.escrowHold.status !== 'HELD') {
        throw new BadRequestException(`Escrow hold is not active`);
      }

      const fullAmount = Number(booking.escrowHold.amount);
      const splitAmount = fullAmount / 2;

      const requesterAccount = await this.getOrCreateUserAccount(booking.requesterId, tx);
      const providerAccount = await this.getOrCreateUserAccount(booking.providerId, tx);

      const transaction = await tx.ledgerTransaction.create({
        data: {
          transactionType: 'DISPUTE_SPLIT_SETTLEMENT',
          bookingId,
        },
      });

      // Credit Requester 50%
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: requesterAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: splitAmount,
        },
      });
      await tx.ledgerAccount.update({
        where: { id: requesterAccount.id },
        data: { balance: { increment: splitAmount } },
      });

      // Credit Provider 50%
      await tx.journalEntry.create({
        data: {
          transactionId: transaction.id,
          accountId: providerAccount.id,
          entryType: 'CREDIT' as EntryType,
          amount: splitAmount,
        },
      });
      await tx.ledgerAccount.update({
        where: { id: providerAccount.id },
        data: { balance: { increment: splitAmount } },
      });

      await tx.escrowHold.update({
        where: { id: booking.escrowHold.id },
        data: { status: 'SPLIT' as EscrowStatus },
      });

      return { success: true, split_amount: splitAmount };
    });
  }

  /**
   * Gets authenticated user's wallet summary & ledger activity.
   */
  async getWalletSummary(userId: string) {
    const userAccount = await this.getOrCreateUserAccount(userId);

    // Calculate escrowed balance
    const activeEscrows = await prisma.escrowHold.aggregate({
      where: {
        booking: {
          requesterId: userId,
          status: { in: ['PENDING_ACCEPTANCE', 'CONFIRMED', 'IN_PROGRESS'] },
        },
        status: 'HELD',
      },
      _sum: {
        amount: true,
      },
    });

    const availableBalance = Number(userAccount.balance);
    const escrowedBalance = Number(activeEscrows._sum.amount || 0);
    const totalBalance = availableBalance + escrowedBalance;

    // Fetch journal entry transaction history
    const journalEntries = await prisma.journalEntry.findMany({
      where: { accountId: userAccount.id },
      include: {
        transaction: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const history = journalEntries.map((e) => ({
      id: e.id,
      transaction_id: e.transactionId,
      transaction_type: e.transaction.transactionType,
      booking_id: e.transaction.bookingId,
      entry_type: e.entryType,
      amount: Number(e.amount),
      created_at: e.createdAt.toISOString(),
    }));

    return {
      available_balance: availableBalance,
      escrowed_balance: escrowedBalance,
      total_balance: totalBalance,
      ledger_account_id: userAccount.id,
      history,
    };
  }
}
