/**
 * @what DIコンテナ / 依存関係の構成
 * @why 各レイヤーの依存関係を組み立て、アプリケーションコンテキストを構築
 *
 * composition層のルール:
 * - すべてのレイヤーをimport可能
 * - 依存関係の注入とファクトリを担当
 * - アプリケーション全体の構成を1箇所に集約
 */

import {
  InMemoryUserRepository,
  InMemoryAuthUserRepository,
  InMemoryRefreshTokenRepository,
  InMemoryPasswordResetTokenRepository,
  BcryptPasswordService,
  JwtServiceImpl,
  CryptoTokenHashService,
} from '../infrastructure/index.js';

import {
  CreateUserUseCase,
  GetUserUseCase,
  RegisterUseCase,
  LoginUseCase,
  LogoutUseCase,
  RefreshTokenUseCase,
  ForgotPasswordUseCase,
  ResetPasswordUseCase,
  GetCurrentUserUseCase,
  ConsoleEmailService,
} from '../usecase/index.js';

import {
  UserController,
  AuthController,
  AuthMiddleware,
  type RouteContext,
} from '../presentation/index.js';

/**
 * 環境変数から設定を読み込む
 */
function getConfig() {
  return {
    jwt: {
      secret: process.env.JWT_SECRET ?? 'dev-secret-key',
      accessTokenExpiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '900', 10),
      refreshTokenExpiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '604800', 10),
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '10', 10),
    },
    debug: process.env.NODE_ENV !== 'production',
  };
}

/**
 * アプリケーションコンテキストを作成
 * 本番環境では環境変数等で実装を切り替える
 */
export function createAppContext(): RouteContext {
  const config = getConfig();

  // ============================================
  // Infrastructure - Repositories
  // ============================================
  const userRepository = new InMemoryUserRepository();
  const authUserRepository = new InMemoryAuthUserRepository();
  const refreshTokenRepository = new InMemoryRefreshTokenRepository();
  const passwordResetTokenRepository = new InMemoryPasswordResetTokenRepository();

  // ============================================
  // Infrastructure - Services
  // ============================================
  const passwordService = new BcryptPasswordService(config.bcrypt.rounds);
  const jwtService = new JwtServiceImpl(config.jwt);
  const tokenHashService = new CryptoTokenHashService();
  const emailService = new ConsoleEmailService();

  // ============================================
  // UseCases - User
  // ============================================
  const createUserUseCase = new CreateUserUseCase(userRepository);
  const getUserUseCase = new GetUserUseCase(userRepository);

  // ============================================
  // UseCases - Auth
  // ============================================
  const registerUseCase = new RegisterUseCase(authUserRepository, passwordService);
  const loginUseCase = new LoginUseCase(
    authUserRepository,
    refreshTokenRepository,
    passwordService,
    jwtService,
    tokenHashService
  );
  const logoutUseCase = new LogoutUseCase(refreshTokenRepository);
  const refreshTokenUseCase = new RefreshTokenUseCase(
    authUserRepository,
    refreshTokenRepository,
    jwtService,
    tokenHashService
  );
  const forgotPasswordUseCase = new ForgotPasswordUseCase(
    authUserRepository,
    passwordResetTokenRepository,
    tokenHashService,
    emailService,
    config.debug
  );
  const resetPasswordUseCase = new ResetPasswordUseCase(
    authUserRepository,
    passwordResetTokenRepository,
    refreshTokenRepository,
    passwordService,
    tokenHashService
  );
  const getCurrentUserUseCase = new GetCurrentUserUseCase(authUserRepository);

  // ============================================
  // Controllers
  // ============================================
  const userController = new UserController(createUserUseCase, getUserUseCase);
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    logoutUseCase,
    refreshTokenUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
    getCurrentUserUseCase
  );

  // ============================================
  // Middleware
  // ============================================
  const authMiddleware = new AuthMiddleware(jwtService);

  return {
    userController,
    authController,
    authMiddleware,
  };
}
