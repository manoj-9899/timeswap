import { z } from 'zod';

export const discoveryOfferQuerySchema = z.object({
  q: z.string().optional(),
  category_id: z.string().optional(),
  delivery_format: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).optional(),
  duration: z.coerce.number().optional(),
  min_duration: z.coerce.number().optional(),
  max_duration: z.coerce.number().optional(),
  city: z.string().optional(),
  general_district: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const discoveryRequestQuerySchema = z.object({
  q: z.string().optional(),
  category_id: z.string().optional(),
  preferred_format: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).optional(),
  target_duration: z.coerce.number().optional(),
  urgency: z.string().optional(),
  city: z.string().optional(),
  general_district: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export const discoveryMemberQuerySchema = z.object({
  q: z.string().optional(),
  skill_id: z.string().optional(),
  role: z.enum(['OFFERED', 'LEARNING']).optional(),
  delivery_preference: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).optional(),
  city: z.string().optional(),
  general_district: z.string().optional(),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(10),
});

export type DiscoveryOfferQueryDto = z.infer<typeof discoveryOfferQuerySchema>;
export type DiscoveryRequestQueryDto = z.infer<typeof discoveryRequestQuerySchema>;
export type DiscoveryMemberQueryDto = z.infer<typeof discoveryMemberQuerySchema>;
