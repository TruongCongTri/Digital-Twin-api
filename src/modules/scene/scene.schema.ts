import { z } from 'zod';

// Reusable 3D Coordinate Schema
const vector3Schema = z.object({
  x: z.number(),
  y: z.number(),
  z: z.number(),
});

/**
 * @schema createSceneSchema
 * @description Validates incoming payload for creating a new score event.
 *
 */
export const createSceneSchema = z.object({
  body: z.object({
    name: z.string().min(3).max(100),
    description: z.string().max(500).optional().nullable(),
    cameraState: z.object({
      position: vector3Schema,
      target: vector3Schema,
    }),
    layerVisibility: z.record(z.string(), z.boolean()).optional(), // e.g., { "HVAC": true, "Plumbing": false }
  }),
});

/**
 * @schema updateSceneSchema
 * @description Validates partial payloads for update.
 */
export const createAnnotationSchema = z.object({
  body: z.object({
    text: z.string().min(1).max(1000),
    position: vector3Schema,
  }),
});

export type CreateSceneDTO = z.infer<typeof createSceneSchema>['body'];
export type CreateAnnotationDTO = z.infer<typeof createAnnotationSchema>['body'];
