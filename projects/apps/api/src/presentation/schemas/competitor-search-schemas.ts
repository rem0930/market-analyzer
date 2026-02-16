/**
 * @what 競合検索・一括登録のバリデーションスキーマ
 * @why リクエストボディの型安全なバリデーションを提供（FR-006, AC-003, AC-007）
 */

import { z } from 'zod';

export const searchCompetitorsSchema = z.object({
  radiusMeters: z
    .number({ error: 'radiusMeters is required' })
    .int('radiusMeters must be an integer')
    .min(100, 'radiusMeters must be at least 100')
    .max(50000, 'radiusMeters must be at most 50000'),
  keyword: z
    .string({ error: 'keyword is required' })
    .min(1, 'keyword must be at least 1 character')
    .max(100, 'keyword must be at most 100 characters'),
  maxResults: z
    .number()
    .int('maxResults must be an integer')
    .min(1, 'maxResults must be at least 1')
    .max(60, 'maxResults must be at most 60')
    .optional(),
});

const bulkCreateCompetitorItemSchema = z.object({
  name: z
    .string({ error: 'name is required' })
    .min(1, 'name must be at least 1 character')
    .max(100, 'name must be at most 100 characters'),
  longitude: z
    .number({ error: 'longitude is required' })
    .min(-180, 'longitude must be between -180 and 180')
    .max(180, 'longitude must be between -180 and 180'),
  latitude: z
    .number({ error: 'latitude is required' })
    .min(-90, 'latitude must be between -90 and 90')
    .max(90, 'latitude must be between -90 and 90'),
  googlePlaceId: z
    .string({ error: 'googlePlaceId is required' })
    .min(1, 'googlePlaceId must not be empty')
    .max(200, 'googlePlaceId must be at most 200 characters'),
  category: z.string().max(100, 'category must be at most 100 characters').optional(),
});

export const bulkCreateCompetitorsSchema = z.object({
  competitors: z
    .array(bulkCreateCompetitorItemSchema, { error: 'competitors is required' })
    .min(1, 'competitors must contain at least 1 item')
    .max(50, 'competitors must contain at most 50 items'),
});

export type SearchCompetitorsInput = z.infer<typeof searchCompetitorsSchema>;
export type BulkCreateCompetitorsInput = z.infer<typeof bulkCreateCompetitorsSchema>;
