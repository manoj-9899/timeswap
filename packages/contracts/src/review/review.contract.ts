import { z } from 'zod';

export const createReviewSchema = z.object({
  session_id: z.string().uuid('Valid session ID is required'),
  rating: z.number().int().min(1).max(5, 'Rating must be between 1 and 5'),
  attribute_tags: z.array(z.string()).optional(),
  comment_text: z.string().max(1000, 'Comment cannot exceed 1000 characters').optional(),
});

export type CreateReviewDto = z.infer<typeof createReviewSchema>;
