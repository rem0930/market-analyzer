/**
 * @what 商圏関連のバリデーションスキーマ
 * @why リクエストボディの型安全なバリデーションを提供
 */

import { z } from 'zod';

export const createTradeAreaSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name must be at most 100 characters'),
  longitude: z
    .number({ error: 'Longitude is required' })
    .min(-180, 'Longitude must be between -180 and 180')
    .max(180, 'Longitude must be between -180 and 180'),
  latitude: z
    .number({ error: 'Latitude is required' })
    .min(-90, 'Latitude must be between -90 and 90')
    .max(90, 'Latitude must be between -90 and 90'),
  radiusKm: z
    .number({ error: 'Radius is required' })
    .min(0.1, 'Radius must be at least 0.1 km')
    .max(50, 'Radius must be at most 50 km'),
});

export const updateTradeAreaSchema = z
  .object({
    name: z
      .string()
      .min(1, 'Name must be at least 1 character')
      .max(100, 'Name must be at most 100 characters')
      .optional(),
    longitude: z
      .number()
      .min(-180, 'Longitude must be between -180 and 180')
      .max(180, 'Longitude must be between -180 and 180')
      .optional(),
    latitude: z
      .number()
      .min(-90, 'Latitude must be between -90 and 90')
      .max(90, 'Latitude must be between -90 and 90')
      .optional(),
    radiusKm: z
      .number()
      .min(0.1, 'Radius must be at least 0.1 km')
      .max(50, 'Radius must be at most 50 km')
      .optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'At least one field must be provided'
  );

export type CreateTradeAreaInput = z.infer<typeof createTradeAreaSchema>;
export type UpdateTradeAreaInput = z.infer<typeof updateTradeAreaSchema>;
