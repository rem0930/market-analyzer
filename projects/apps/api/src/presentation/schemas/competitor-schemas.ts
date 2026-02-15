/**
 * @what 競合店舗関連のバリデーションスキーマ
 * @why リクエストボディの型安全なバリデーションを提供
 */

import { z } from 'zod';

export const createCompetitorSchema = z.object({
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
  source: z.enum(['manual', 'google_places'], {
    error: 'Source must be "manual" or "google_places"',
  }),
  googlePlaceId: z.string().max(200, 'Google Place ID must be at most 200 characters').optional(),
  category: z.string().max(100, 'Category must be at most 100 characters').optional(),
});

export const updateCompetitorSchema = z
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
    category: z.string().max(100, 'Category must be at most 100 characters').nullable().optional(),
  })
  .refine(
    (data) => Object.values(data).some((v) => v !== undefined),
    'At least one field must be provided'
  )
  .refine(
    (data) => (data.longitude !== undefined) === (data.latitude !== undefined),
    'Both longitude and latitude must be provided together'
  );

export type CreateCompetitorInput = z.infer<typeof createCompetitorSchema>;
export type UpdateCompetitorInput = z.infer<typeof updateCompetitorSchema>;
