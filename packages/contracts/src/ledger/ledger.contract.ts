import { z } from 'zod';

export const ledgerAccountTypeEnum = z.enum([
  'USER_WALLET',
  'ESCROW_HOLD',
  'SYSTEM_RESERVE',
  'TREASURY_SINK',
]);

export const entryTypeEnum = z.enum(['DEBIT', 'CREDIT']);

export const walletSummarySchema = z.object({
  available_balance: z.number(),
  escrowed_balance: z.number(),
  total_balance: z.number(),
  ledger_account_id: z.string(),
});

export type WalletSummaryDto = z.infer<typeof walletSummarySchema>;
