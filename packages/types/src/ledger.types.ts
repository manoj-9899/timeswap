import { LedgerAccountType, EntryType } from './enums.js';

export interface WalletSummary {
  userId: string;
  availableBalance: number;
  escrowedBalance: number;
  totalBalance: number;
}

export interface JournalEntryRecord {
  id: string;
  transactionId: string;
  accountId: string;
  accountType: LedgerAccountType;
  entryType: EntryType;
  amount: number;
  createdAt: Date;
}
