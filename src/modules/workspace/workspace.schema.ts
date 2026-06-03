import { z } from 'zod';
import { MESSAGES } from '@/constants/messages';
import { FIELDS } from '@/constants/fields';

/**
 * @schema createWorkspaceSchema
 * @description Validates incoming payload for creating a new score event.
 *
 */
export const createWorkspaceSchema = z.object({
  body: z.object({
    name: z.string().min(3, MESSAGES.VALIDATION.MIN_LENGTH(FIELDS.WORKSPACE_NAME, 3)),
    description: z.string().max(500).optional().nullable(),
  }),
});

export const updateWorkspaceSchema = z.object({
  body: z
    .object({
      name: z.string().min(3, MESSAGES.VALIDATION.MIN_LENGTH(FIELDS.WORKSPACE_NAME, 3)).optional(),
      description: z.string().max(500).optional().nullable(),
    })
    .refine((data) => Object.keys(data).length > 0, {
      message: 'At least one field (name or description) must be provided to update.',
    }),
});

export const inviteMemberSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Invalid email address format')
      .transform((e) => e.toLowerCase().trim()),
    role: z.enum(['EDITOR', 'VIEWER']),
  }),
});

export const acceptInviteSchema = z.object({
  body: z.object({
    token: z.string().min(32, 'Invalid token'),
  }),
});

export const updateMemberRoleSchema = z.object({
  body: z.object({
    role: z.enum(['OWNER', 'EDITOR', 'VIEWER']),
  }),
});

export type CreateWorkspaceDTO = z.infer<typeof createWorkspaceSchema>['body'];
export type UpdateWorkspaceDTO = z.infer<typeof updateWorkspaceSchema>['body'];

export type InviteMemberDTO = z.infer<typeof inviteMemberSchema>['body'];
export type AcceptInviteDTO = z.infer<typeof acceptInviteSchema>['body'];

export type UpdateMemberRoleDTO = z.infer<typeof updateMemberRoleSchema>['body'];
