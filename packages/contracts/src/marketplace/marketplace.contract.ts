import { z } from 'zod';

export const createOfferSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  category_id: z.string().uuid('Invalid category ID'),
  supported_durations: z
    .array(z.number().refine((val) => val === 30 || val === 60, 'Duration must be 30 or 60 minutes'))
    .min(1, 'Select at least one supported duration (30 or 60 min)'),
  delivery_format: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']),
  city: z.string().optional(),
  general_district: z.string().optional(),
});

export const updateOfferSchema = createOfferSchema.partial();

export const createHelpRequestSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must be at most 2000 characters'),
  category_id: z.string().uuid('Invalid category ID'),
  target_duration: z.number().refine((val) => val === 30 || val === 60, 'Target duration must be 30 or 60 minutes'),
  preferred_format: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']),
  urgency: z.enum(['URGENT', 'THIS_WEEK', 'FLEXIBLE']).optional(),
  city: z.string().optional(),
  general_district: z.string().optional(),
});

export const updateHelpRequestSchema = createHelpRequestSchema.partial();

export const submitProposalSchema = z.object({
  proposed_start_time: z.string().datetime({ message: 'Invalid ISO8601 start time' }),
  duration_minutes: z.number().refine((val) => val === 30 || val === 60, 'Duration must be 30 or 60 minutes'),
  message: z.string().min(10, 'Message must be at least 10 characters long'),
});

export type CreateOfferDto = z.infer<typeof createOfferSchema>;
export type UpdateOfferDto = z.infer<typeof updateOfferSchema>;
export type CreateHelpRequestDto = z.infer<typeof createHelpRequestSchema>;
export type UpdateHelpRequestDto = z.infer<typeof updateHelpRequestSchema>;
export type SubmitProposalDto = z.infer<typeof submitProposalSchema>;
