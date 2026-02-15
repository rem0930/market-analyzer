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

// Trade Area usecases
export {
  CreateTradeAreaUseCase,
  type CreateTradeAreaInput,
  type CreateTradeAreaOutput,
  type CreateTradeAreaError,
  GetTradeAreaUseCase,
  type GetTradeAreaInput,
  type GetTradeAreaOutput,
  type GetTradeAreaError,
  ListTradeAreasUseCase,
  type ListTradeAreasInput,
  type ListTradeAreasOutput,
  type ListTradeAreasError,
  type TradeAreaItem,
  DeleteTradeAreaUseCase,
  type DeleteTradeAreaInput,
  type DeleteTradeAreaError,
  UpdateTradeAreaUseCase,
  type UpdateTradeAreaInput,
  type UpdateTradeAreaOutput,
  type UpdateTradeAreaError,
  GetDemographicsUseCase,
  type GetDemographicsInput,
  type GetDemographicsOutput,
  type GetDemographicsError,
} from './trade-area/index.js';

// Profile usecases
export {
  ChangeNameUseCase,
  type ChangeNameInput,
  type ChangeNameOutput,
  type ChangeNameError,
  ChangePasswordUseCase,
  type ChangePasswordInput,
  type ChangePasswordOutput,
  type ChangePasswordError,
} from './profile/index.js';

// Store usecases
export {
  CreateStoreUseCase,
  type CreateStoreInput,
  type CreateStoreOutput,
  type CreateStoreError,
  GetStoreUseCase,
  type GetStoreInput,
  type GetStoreOutput,
  type GetStoreError,
  ListStoresUseCase,
  type ListStoresInput,
  type ListStoresOutput,
  type ListStoresError,
  type StoreItem,
  UpdateStoreUseCase,
  type UpdateStoreInput,
  type UpdateStoreOutput,
  type UpdateStoreError,
  DeleteStoreUseCase,
  type DeleteStoreInput,
  type DeleteStoreError,
} from './store/index.js';
