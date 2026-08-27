import { z } from 'zod';

export const createBookingSchema = z.object({
  service_offer_id: z.string().uuid('Invalid service offer ID').optional(),
  help_request_id: z.string().uuid('Invalid help request ID').optional(),
  scheduled_start_time: z.string().datetime({ message: 'Invalid ISO8601 scheduled start time' }),
  duration_minutes: z.number().refine((val) => val > 0 && val % 60 === 0, {
    message: 'Duration must be in 60-minute increments (1 Credit = 1 Hour)',
  }),
}).refine((data) => data.service_offer_id || data.help_request_id, {
  message: 'Either service_offer_id or help_request_id must be provided',
});

export const cancelBookingSchema = z.object({
  cancellation_reason: z.string().max(500, 'Cancellation reason must not exceed 500 characters').optional(),
});

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type CancelBookingDto = z.infer<typeof cancelBookingSchema>;
