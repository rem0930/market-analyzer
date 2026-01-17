/**
 * @what プロフィール関連のバリデーションスキーマ
 * @why リクエストボディの型安全なバリデーションを提供
 */

import { z } from 'zod';

export const updateNameSchema = z.object({
  name: z
    .string({ error: 'Name is required' })
    .min(1, 'Name must be at least 1 character')
    .max(100, 'Name must be at most 100 characters'),
});

export const updatePasswordSchema = z.object({
  currentPassword: z
    .string({ error: 'Current password is required' })
    .min(1, 'Current password is required'),
  newPassword: z
    .string({ error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export type UpdateNameInput = z.infer<typeof updateNameSchema>;
export type UpdatePasswordInput = z.infer<typeof updatePasswordSchema>;
