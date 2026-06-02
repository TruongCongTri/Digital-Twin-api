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

// Admin: Search and filter all users
export const getUsersQuerySchema = z.object({
  query: paginationSchema.extend({
    search: z.string().trim().optional(), // Search by email or name
    role: z.enum(['ADMIN', 'USER']).optional(),
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
  }),
});

// Admin: Promote/Demote User
export const updateUserRoleSchema = z.object({
  body: z.object({
    role: z.enum(['ADMIN', 'USER'], {
      error: () => ({ message: MESSAGES.VALIDATION.INVALID_ENUM(FIELDS.ROLE) }),
    }),
  }),
});

// User: Update own profile
export const updateProfileSchema = z.object({
  body: z.object({
    fullName: z
      .string({ message: MESSAGES.VALIDATION.MUST_BE_STRING(FIELDS.FULL_NAME) })
      .trim()
      .min(2, { message: MESSAGES.VALIDATION.MIN_LENGTH(FIELDS.FULL_NAME, 2) })
      .max(100, { message: MESSAGES.VALIDATION.MAX_LENGTH(FIELDS.FULL_NAME, 100) })
      .optional(),
  }),
});

export type GetApplicantsQueryDTO = z.infer<typeof getApplicantsQuerySchema>['query'];
export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>['body'];
export type GetUsersQueryDTO = z.infer<typeof getUsersQuerySchema>['query'];
export type UpdateUserRoleDTO = z.infer<typeof updateUserRoleSchema>['body'];
export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>['body'];
