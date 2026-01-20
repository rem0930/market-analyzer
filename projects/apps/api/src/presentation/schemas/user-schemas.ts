/**
 * @what ユーザー関連のバリデーションスキーマ
 * @why リクエストボディの型安全なバリデーションを提供
 */

import { z } from 'zod';

export const createUserSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name must be at most 100 characters'),
  email: z.string({ error: 'Email is required' }).email('Invalid email format'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
