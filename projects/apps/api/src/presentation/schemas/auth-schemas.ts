/**
 * @what 認証関連のバリデーションスキーマ
 * @why リクエストボディの型安全なバリデーションを提供
 */

import { z } from 'zod';

export const registerSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Invalid email format'),
  password: z
    .string({ error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const loginSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Invalid email format'),
  password: z.string({ error: 'Password is required' }).min(1, 'Password is required'),
});

export const refreshSchema = z.object({
  refreshToken: z
    .string({ error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string({ error: 'Email is required' }).email('Invalid email format'),
});

export const resetPasswordSchema = z.object({
  token: z.string({ error: 'Token is required' }).min(1, 'Token is required'),
  newPassword: z
    .string({ error: 'New password is required' })
    .min(8, 'Password must be at least 8 characters')
    .regex(/[A-Za-z]/, 'Password must contain at least one letter')
    .regex(/[0-9]/, 'Password must contain at least one number'),
});

export const logoutSchema = z.object({
  refreshToken: z
    .string({ error: 'Refresh token is required' })
    .min(1, 'Refresh token is required'),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RefreshInput = z.infer<typeof refreshSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type LogoutInput = z.infer<typeof logoutSchema>;
