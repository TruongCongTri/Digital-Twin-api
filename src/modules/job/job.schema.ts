import { z } from 'zod';
import { MESSAGES } from '@/constants/messages';
import { FIELDS } from '@/constants/fields';

/**
 * @schema createJobSchema
 * @description Validates incoming payload for creating a new score event.
 *
 */
export const createJobSchema = z.object({
  body: z.object({
    assetId: z.string().uuid(MESSAGES.VALIDATION.INVALID_UUID(FIELDS.ASSET_ID)),
  }),
});

/**
 * @schema updateJobSchema
 * @description Validates partial payloads for update.
 */
export const updateJobSchema = z.object({
  body: z.object({
    status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED']).optional(),
    progress: z.number().min(0).max(100).optional(),
    errorLog: z.string().optional(),
  }),
});

export type CreateJobDTO = z.infer<typeof createJobSchema>['body'];
export type UpdateJobDTO = z.infer<typeof updateJobSchema>['body'];
