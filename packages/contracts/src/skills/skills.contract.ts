import { z } from 'zod';

export const attachSkillSchema = z.object({
  skill_id: z.string().uuid('Invalid skill ID'),
  role: z.enum(['OFFERED', 'LEARNING']),
});

export const removeSkillQuerySchema = z.object({
  role: z.enum(['OFFERED', 'LEARNING']),
});

export const listSkillsQuerySchema = z.object({
  category_id: z.string().optional(),
  q: z.string().optional(),
});

export type AttachSkillDto = z.infer<typeof attachSkillSchema>;
export type RemoveSkillQueryDto = z.infer<typeof removeSkillQuerySchema>;
export type ListSkillsQueryDto = z.infer<typeof listSkillsQuerySchema>;
