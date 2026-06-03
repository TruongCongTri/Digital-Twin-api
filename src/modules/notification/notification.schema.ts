import { z } from 'zod';

export const sendNotificationSchema = z.object({
  body: z.object({
    userId: z.string().uuid(),
    title: z.string().min(1).max(100),
    message: z.string().max(500),
    type: z.enum(['INFO', 'SUCCESS', 'WARNING', 'ERROR']).default('INFO'),
    relatedEntityId: z.string().uuid().optional().nullable(),
  }),
});

export type SendNotificationDTO = z.infer<typeof sendNotificationSchema>['body'];
