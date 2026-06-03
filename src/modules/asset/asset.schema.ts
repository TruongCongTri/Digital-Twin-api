import { z } from 'zod';
import { MESSAGES } from '@/constants/messages';
import { FIELDS } from '@/constants/fields';
import { paginationSchema } from '@/common/schemas/reusable.schema';

/**
 * @schema createAssetSchema
 * @description Validates incoming payload for creating a new score event.
 *
 */
export const createAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Asset name is required'),
    description: z.string().optional(),
    fileType: z.enum(['SHAPE', 'ATTRIBUTE', 'POINT'], {
      error: () => ({ message: MESSAGES.VALIDATION.INVALID_ENUM(FIELDS.ASSET_FILE) }),
    }),
    bindToShapeId: z.string().uuid('Invalid Shape ID').optional(),

    // Metadata will come in as a stringified JSON object from form-data
    metadata: z
      .string()
      .optional()
      .refine(
        (val) => {
          if (!val) return true;
          try {
            JSON.parse(val);
            return true;
          } catch {
            return false;
          }
        },
        { message: 'Metadata must be a valid JSON string' }
      ),
  }),
});

/**
 * @schema updateAssetSchema
 * @description Validates partial payloads for update.
 */
export const updateAssetStatusSchema = z.object({
  body: z.object({
    status: z.enum(['APPROVED', 'REJECTED']),
  }),
});

export const getAssetsQuerySchema = z.object({
  query: paginationSchema.extend({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED']).optional(),
    fileType: z.enum(['SHAPE', 'ATTRIBUTE', 'POINT']).optional(),
    search: z.string().optional(),
  }),
});

export const updateAssetSchema = z.object({
  body: z.object({
    name: z.string().min(1).optional(),
    description: z.string().optional(),
  }),
});

export type CreateAssetDTO = z.infer<typeof createAssetSchema>['body'];
export type UpdateAssetStatusDTO = z.infer<typeof updateAssetStatusSchema>['body'];
export type UpdateAssetDTO = z.infer<typeof updateAssetSchema>['body'];
export type GetAssetsQueryDTO = z.infer<typeof getAssetsQuerySchema>['query'];
