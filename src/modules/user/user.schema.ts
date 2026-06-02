import { z } from 'zod';
import { MESSAGES } from '@/constants/messages';
import { FIELDS } from '@/constants/fields';
import { paginationSchema } from '@/common/schemas/reusable.schema';
import { APPLICATION_APPROVAL_STATUS, APPLICATION_STATUS } from '@/constants/app.constant';

/**
 * @schema getApplicantsQuerySchema
 * @description Validates query parameters for the Admin applicant dashboard.
 */
export const getApplicantsQuerySchema = z.object({
  query: paginationSchema.extend({
    status: z.enum(APPLICATION_STATUS).optional(),
  }),
});

/**
 * @schema updateUserStatusSchema
 * @description Validates the payload when an Admin approves/rejects a user.
 */
export const updateUserStatusSchema = z.object({
  body: z.object({
    status: z.enum(APPLICATION_APPROVAL_STATUS, {
      message: MESSAGES.VALIDATION.INVALID_ENUM(FIELDS.STATUS),
    }),
  }),
});

export type GetApplicantsQueryDTO = z.infer<typeof getApplicantsQuerySchema>['query'];
export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>['body'];
