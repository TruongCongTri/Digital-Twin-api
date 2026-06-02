import { z } from 'zod';
import { MESSAGES } from '@/constants/messages';
import { FIELDS } from '@/constants/fields';

export const registerSchema = z.object({
  body: z.object({
    email: z
      .string({ message: MESSAGES.VALIDATION.REQUIRED(FIELDS.EMAIL) })
      .email({ message: MESSAGES.VALIDATION.INVALID_EMAIL }),
    password: z
      .string({ message: MESSAGES.VALIDATION.REQUIRED(FIELDS.PASSWORD) })
      .min(8, { message: MESSAGES.VALIDATION.MIN_LENGTH(FIELDS.PASSWORD, 8) }),
    fullName: z
      .string({ message: MESSAGES.VALIDATION.REQUIRED(FIELDS.FULL_NAME) })
      .min(2, { message: MESSAGES.VALIDATION.MIN_LENGTH(FIELDS.FULL_NAME, 2) }),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z
      .string({ message: MESSAGES.VALIDATION.REQUIRED(FIELDS.EMAIL) })
      .email({ message: MESSAGES.VALIDATION.INVALID_EMAIL }),
    password: z
      .string({ message: MESSAGES.VALIDATION.REQUIRED(FIELDS.PASSWORD) })
      .min(1, { message: MESSAGES.VALIDATION.REQUIRED(FIELDS.PASSWORD) }),
  }),
});

export type RegisterDTO = z.infer<typeof registerSchema>['body'];
export type LoginDTO = z.infer<typeof loginSchema>['body'];
