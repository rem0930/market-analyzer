/**
 * @what ユースケース層のエクスポート
 * @why usecase層の公開APIを明示
 */

export {
  CreateUserUseCase,
  type CreateUserInput,
  type CreateUserOutput,
  type CreateUserError,
} from './user/create-user.js';

export {
  GetUserUseCase,
  type GetUserInput,
  type GetUserOutput,
  type GetUserError,
} from './user/get-user.js';

// Auth usecases
export {
  RegisterUseCase,
  type RegisterInput,
  type RegisterOutput,
  type RegisterError,
  LoginUseCase,
  type LoginInput,
  type LoginOutput,
  type LoginError,
  LogoutUseCase,
  type LogoutInput,
  type LogoutError,
  RefreshTokenUseCase,
  type RefreshTokenInput,
  type RefreshTokenOutput,
  type RefreshTokenError,
  ForgotPasswordUseCase,
  ConsoleEmailService,
  type ForgotPasswordInput,
  type ForgotPasswordOutput,
  type ForgotPasswordError,
  type EmailService,
  ResetPasswordUseCase,
  type ResetPasswordInput,
  type ResetPasswordOutput,
  type ResetPasswordError,
  GetCurrentUserUseCase,
  type GetCurrentUserInput,
  type GetCurrentUserOutput,
  type GetCurrentUserError,
} from './auth/index.js';

// Health usecases
export {
  DeepPingUseCase,
  type DeepPingOutput,
  type HealthCheck,
  type DatabaseHealthChecker,
} from './health/index.js';
