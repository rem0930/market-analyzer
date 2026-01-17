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
  // In-memory repositories
  InMemoryUserRepository,
  InMemoryAuthUserRepository,
  InMemoryRefreshTokenRepository,
  InMemoryPasswordResetTokenRepository,
  // Prisma repositories
  PrismaUserRepository,
  PrismaAuthUserRepository,
  PrismaRefreshTokenRepository,
  PrismaPasswordResetTokenRepository,
  // Database
  prisma,
  // Services
  BcryptPasswordService,
  JwtServiceImpl,
  CryptoTokenHashService,
  // Health checkers
  PrismaDatabaseHealthChecker,
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
  DeepPingUseCase,
  ChangeNameUseCase,
  ChangePasswordUseCase,
} from '../usecase/index.js';

import {
  UserController,
  AuthController,
  ProfileController,
  DeepPingController,
  AuthMiddleware,
  SecurityMiddleware,
  CorsMiddleware,
  RateLimitMiddleware,
  ValidationMiddleware,
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
      rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    },
    debug: process.env.NODE_ENV !== 'production',
    usePrisma: !!process.env.DATABASE_URL,
  };
}

/**
 * アプリケーションコンテキストを作成
 * DATABASE_URL が設定されている場合は Prisma、なければ In-memory を使用
 */
export function createAppContext(): RouteContext {
  const config = getConfig();

  // ============================================
  // Infrastructure - Repositories
  // ============================================
  const userRepository = config.usePrisma
    ? new PrismaUserRepository(prisma)
    : new InMemoryUserRepository();

  const authUserRepository = config.usePrisma
    ? new PrismaAuthUserRepository(prisma)
    : new InMemoryAuthUserRepository();

  const refreshTokenRepository = config.usePrisma
    ? new PrismaRefreshTokenRepository(prisma)
    : new InMemoryRefreshTokenRepository();

  const passwordResetTokenRepository = config.usePrisma
    ? new PrismaPasswordResetTokenRepository(prisma)
    : new InMemoryPasswordResetTokenRepository();

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
  // UseCases - Profile
  // ============================================
  const changeNameUseCase = new ChangeNameUseCase(userRepository);
  const changePasswordUseCase = new ChangePasswordUseCase(
    authUserRepository,
    refreshTokenRepository,
    passwordService
  );

  // ============================================
  // UseCases - Health
  // ============================================
  const databaseHealthChecker = config.usePrisma ? new PrismaDatabaseHealthChecker(prisma) : null;
  const deepPingUseCase = new DeepPingUseCase(databaseHealthChecker);

  // ============================================
  // Middleware (validation needs to be before controllers)
  // ============================================
  const validationMiddleware = new ValidationMiddleware();

  // ============================================
  // Controllers
  // ============================================
  const userController = new UserController(createUserUseCase, getUserUseCase);
  const deepPingController = new DeepPingController(deepPingUseCase);
  const authController = new AuthController(
    registerUseCase,
    loginUseCase,
    logoutUseCase,
    refreshTokenUseCase,
    forgotPasswordUseCase,
    resetPasswordUseCase,
    getCurrentUserUseCase,
    validationMiddleware
  );
  const profileController = new ProfileController(
    changeNameUseCase,
    changePasswordUseCase,
    validationMiddleware
  );

  // ============================================
  // Middleware
  // ============================================
  const authMiddleware = new AuthMiddleware(jwtService);
  const securityMiddleware = new SecurityMiddleware();
  const corsMiddleware = new CorsMiddleware();
  const rateLimitMiddleware = new RateLimitMiddleware({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 5, // 5 requests per minute per IP
  });

  return {
    userController,
    authController,
    profileController,
    deepPingController,
    authMiddleware,
    securityMiddleware,
    corsMiddleware,
    rateLimitMiddleware,
  };
}
