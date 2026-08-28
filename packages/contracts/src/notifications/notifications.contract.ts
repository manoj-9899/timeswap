import { z } from 'zod';

export const createNotificationSchema = z.object({
  userId: z.string().uuid(),
  notificationType: z.string().min(1),
  title: z.string().min(1).max(200),
  bodyText: z.string().min(1).max(2000),
  actionUrl: z.string().optional().nullable(),
});

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>;

export const notificationQuerySchema = z.object({
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(50).default(20),
  unread_only: z.preprocess((val) => val === 'true' || val === true, z.boolean()).optional(),
});

export type NotificationQueryInput = z.infer<typeof notificationQuerySchema>;
