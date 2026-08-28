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
  avatar_url: z.string().url('Invalid avatar URL').or(z.literal('')).nullable().optional(),
});

export const completeOnboardingSchema = z.object({
  handle: z
    .string()
    .min(4, 'Handle must be at least 4 characters')
    .max(30, 'Handle must be at most 30 characters')
    .regex(/^[a-z0-9_]+$/, 'Handle must contain only lowercase letters, numbers, and underscores'),
  bio: z.string().min(30, 'Bio must be at least 30 characters long to help others know you'),
  city: z.string().min(2, 'City is required'),
  general_district: z.string().min(2, 'General district is required'),
  delivery_preference: z.enum(['ONLINE', 'IN_PERSON', 'BOTH']).optional(),
  offered_skill_ids: z
    .array(z.string().uuid('Invalid skill ID'))
    .min(1, 'Please select at least one skill you can offer'),
  learning_skill_ids: z
    .array(z.string().uuid('Invalid skill ID'))
    .min(1, 'Please select at least one skill you want to learn'),
});

export function generateHandleSuggestion(name: string): string {
  if (!name) return 'user_profile';
  let clean = name.toLowerCase().replace(/[^a-z0-9_]/g, '');
  if (clean.length < 4) {
    clean = (clean + '_user').slice(0, 15);
  }
  if (clean.length < 4) {
    clean = 'user_profile';
  }
  return clean.slice(0, 30);
}

export function generateHandleAlternatives(baseHandle: string): string[] {
  const clean = baseHandle.toLowerCase().replace(/[^a-z0-9_]/g, '');
  const base = clean.length >= 4 ? clean : `${clean}_user`;

  const alternatives: string[] = [];
  if (!base.includes('_') && base.length > 5) {
    const mid = Math.floor(base.length / 2);
    alternatives.push(`${base.slice(0, mid)}_${base.slice(mid)}`);
  }
  alternatives.push(`${base}1`);
  alternatives.push(`${base}_dev`);
  alternatives.push(`${base}2`);

  return Array.from(new Set(alternatives)).filter((a) => a.length >= 4 && a.length <= 30);
}

export type UpdateProfileDto = z.infer<typeof updateProfileSchema>;
export type CompleteOnboardingDto = z.infer<typeof completeOnboardingSchema>;
