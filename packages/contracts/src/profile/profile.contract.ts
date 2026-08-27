import { z } from 'zod';

export const updateProfileSchema = z.object({
  display_name: z
    .string()
    .min(2, 'Display name must be at least 2 characters')
    .max(50, 'Display name must be at most 50 characters')
    .optional(),
  bio: z.string().max(500, 'Bio must be at most 500 characters').optional(),
  city: z.string().min(2, 'City is required').optional(),
  general_district: z.string().min(2, 'General district is required').optional(),
  delivery_preference: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).optional(),
  avatar_url: z.string().url('Invalid avatar URL').or(z.literal('')).optional(),
});

export const completeOnboardingSchema = z.object({
  handle: z
    .string()
    .min(3, 'Handle must be at least 3 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Handle must contain only lowercase letters, numbers, and underscores'),
  bio: z.string().min(30, 'Bio must be at least 30 characters long to help others know you'),
  city: z.string().min(2, 'City is required'),
  general_district: z.string().min(2, 'General district is required'),
  offered_skill_ids: z
    .array(z.string().uuid('Invalid skill ID'))
    .min(1, 'Please select at least one skill you can offer'),
  learning_skill_ids: z
    .array(z.string().uuid('Invalid skill ID'))
    .min(1, 'Please select at least one skill you want to learn'),
});

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type CompleteOnboardingDto = z.infer<typeof completeOnboardingSchema>;
