/**
 * @what ドメイン層のエクスポート
 * @why domain層の公開APIを明示
 */

export {
  User,
  UserId,
  UserCreatedEvent,
  UserEmailChangedEvent,
  UserNameChangedEvent,
} from './user/user.js';
export type { CreateUserParams } from './user/user.js';
export type { UserRepository, UserRepositoryError } from './user/user-repository.js';

// Auth domain
export {
  AuthUserId,
  PasswordHash,
  AuthUser,
  AuthUserRegisteredEvent,
  PasswordChangedEvent,
  RefreshTokenId,
  TokenHash,
  RefreshToken,
  PasswordResetTokenId,
  PasswordResetToken,
} from './auth/index.js';

export type {
  CreateAuthUserParams,
  AuthUserRepository,
  AuthUserRepositoryError,
  CreateRefreshTokenParams,
  RefreshTokenRepository,
  CreatePasswordResetTokenParams,
  PasswordResetTokenRepository,
  // Service interfaces
  PasswordService,
  PasswordServiceError,
  TokenHashService,
  JwtService,
  JwtPayload,
  TokenPair,
  JwtServiceError,
} from './auth/index.js';

// Trade Area domain
export {
  CenterPoint,
  Radius,
  TradeAreaName,
  DemographicData,
  TradeAreaId,
  TradeArea,
  TradeAreaCreatedEvent,
} from './trade-area/index.js';
export type {
  AgeDistributionEntry,
  CreateTradeAreaParams,
  TradeAreaRepository,
  DemographicDataProvider,
} from './trade-area/index.js';
