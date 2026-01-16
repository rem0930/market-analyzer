/**
 * @what 認証ユースケースのエクスポート
 */

export {
  RegisterUseCase,
  type RegisterInput,
  type RegisterOutput,
  type RegisterError,
} from './register.js';

export {
  LoginUseCase,
  type LoginInput,
  type LoginOutput,
  type LoginError,
} from './login.js';

export {
  LogoutUseCase,
  type LogoutInput,
  type LogoutError,
} from './logout.js';

export {
  RefreshTokenUseCase,
  type RefreshTokenInput,
  type RefreshTokenOutput,
  type RefreshTokenError,
} from './refresh-token.js';

export {
  ForgotPasswordUseCase,
  ConsoleEmailService,
  type ForgotPasswordInput,
  type ForgotPasswordOutput,
  type ForgotPasswordError,
  type EmailService,
} from './forgot-password.js';

export {
  ResetPasswordUseCase,
  type ResetPasswordInput,
  type ResetPasswordOutput,
  type ResetPasswordError,
} from './reset-password.js';

export {
  GetCurrentUserUseCase,
  type GetCurrentUserInput,
  type GetCurrentUserOutput,
  type GetCurrentUserError,
} from './get-current-user.js';
