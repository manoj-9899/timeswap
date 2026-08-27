import { z } from 'zod';

export const createDisputeSchema = z.object({
  session_id: z.string().uuid('Valid session ID is required'),
  dispute_reason: z.string().min(5, 'Dispute reason must be at least 5 characters'),
  evidence_text: z.string().optional(),
});

export const resolveDisputeSchema = z.object({
  resolution_outcome: z.enum([
    'FULL_REFUND_REQUESTER',
    'FULL_RELEASE_PROVIDER',
    'SPLIT_50_50',
  ]),
  resolution_notes: z.string().min(5, 'Resolution notes are required'),
});

export type CreateDisputeDto = z.infer<typeof createDisputeSchema>;
export type ResolveDisputeDto = z.infer<typeof resolveDisputeSchema>;
