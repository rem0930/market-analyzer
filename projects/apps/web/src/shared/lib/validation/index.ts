/**
 * @layer shared
 * @segment lib
 * @what バリデーションスキーマのエクスポート
 */

export {
  loginSchema,
  registerSchema,
  typedLoginSchema,
  typedRegisterSchema,
  type LoginFormData,
  type RegisterFormData,
} from './auth';

export {
  updateNameSchema,
  updatePasswordSchema,
  typedUpdateNameSchema,
  typedUpdatePasswordSchema,
  type UpdateNameFormData,
  type UpdatePasswordFormData,
} from './profile';
