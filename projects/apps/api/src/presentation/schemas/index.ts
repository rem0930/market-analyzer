/**
 * @what バリデーションスキーマのエクスポート
 * @why スキーマの公開APIを明示
 */

export {
  registerSchema,
  loginSchema,
  refreshSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  logoutSchema,
  type RegisterInput,
  type LoginInput,
  type RefreshInput,
  type ForgotPasswordInput,
  type ResetPasswordInput,
  type LogoutInput,
} from './auth-schemas.js';

export { createUserSchema, type CreateUserInput } from './user-schemas.js';

export {
  updateNameSchema,
  updatePasswordSchema,
  type UpdateNameInput,
  type UpdatePasswordInput,
} from './profile-schemas.js';
