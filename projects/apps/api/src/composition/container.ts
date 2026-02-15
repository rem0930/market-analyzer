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
  InMemoryTradeAreaRepository,
  InMemoryStoreRepository,
  InMemoryCompetitorRepository,
  // Prisma repositories
  PrismaUserRepository,
  PrismaAuthUserRepository,
  PrismaRefreshTokenRepository,
  PrismaPasswordResetTokenRepository,
  PrismaTradeAreaRepository,
  PrismaStoreRepository,
  PrismaCompetitorRepository,
  // Database
  prisma,
  // Services
  BcryptPasswordService,
  JwtServiceImpl,
  CryptoTokenHashService,
  LoggerEmailService,
  MockDemographicDataProvider,
  // Health checkers
  PrismaDatabaseHealthChecker,
  // Logger
  logger,
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
  DeepPingUseCase,
  ChangeNameUseCase,
  ChangePasswordUseCase,
  CreateTradeAreaUseCase,
  GetTradeAreaUseCase,
  ListTradeAreasUseCase,
  DeleteTradeAreaUseCase,
  UpdateTradeAreaUseCase,
  GetDemographicsUseCase,
  CreateStoreUseCase,
  GetStoreUseCase,
  ListStoresUseCase,
  DeleteStoreUseCase,
  UpdateStoreUseCase,
  CreateCompetitorUseCase,
  GetCompetitorUseCase,
  ListCompetitorsByStoreUseCase,
  DeleteCompetitorUseCase,
  UpdateCompetitorUseCase,
} from '../usecase/index.js';

import {
  UserController,
  AuthController,
  ProfileController,
  DeepPingController,
  TradeAreaController,
  StoreController,
  CompetitorController,
  AuthMiddleware,
  SecurityMiddleware,
  CorsMiddleware,
  RateLimitMiddleware,
  CsrfMiddleware,
  ValidationMiddleware,
  type RouteContext,
} from '../presentation/index.js';

const DEV_JWT_SECRET = 'dev-secret-key-do-not-use-in-production';
const MIN_JWT_SECRET_LENGTH = 32;

/**
 * 環境変数から設定を読み込む
 */
function getConfig() {
  const isProduction = process.env.NODE_ENV === 'production';
  const jwtSecret = process.env.JWT_SECRET;

  // 本番環境でのJWT_SECRET検証
  if (isProduction) {
    if (!jwtSecret) {
      logger.error('JWT_SECRET is required in production environment');
      throw new Error('JWT_SECRET environment variable is required in production');
    }
    if (jwtSecret.length < MIN_JWT_SECRET_LENGTH) {
      logger.error('JWT_SECRET is too short', {
        minLength: MIN_JWT_SECRET_LENGTH,
        actualLength: jwtSecret.length,
      });
      throw new Error(`JWT_SECRET must be at least ${MIN_JWT_SECRET_LENGTH} characters`);
    }
  } else if (!jwtSecret) {
    logger.warn('Using default JWT_SECRET for development - do not use in production');
  }

  return {
    jwt: {
      secret: jwtSecret ?? DEV_JWT_SECRET,
      accessTokenExpiresIn: parseInt(process.env.JWT_ACCESS_TOKEN_EXPIRES_IN ?? '900', 10),
      refreshTokenExpiresIn: parseInt(process.env.JWT_REFRESH_TOKEN_EXPIRES_IN ?? '604800', 10),
    },
    bcrypt: {
      rounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10),
    },
    debug: !isProduction,
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

  const tradeAreaRepository = config.usePrisma
    ? new PrismaTradeAreaRepository(prisma)
    : new InMemoryTradeAreaRepository();

  const storeRepository = config.usePrisma
    ? new PrismaStoreRepository(prisma)
    : new InMemoryStoreRepository();

  const competitorRepository = config.usePrisma
    ? new PrismaCompetitorRepository(prisma)
    : new InMemoryCompetitorRepository();

  // ============================================
  // Infrastructure - Services
  // ============================================
  const passwordService = new BcryptPasswordService(config.bcrypt.rounds);
  const jwtService = new JwtServiceImpl(config.jwt);
  const tokenHashService = new CryptoTokenHashService();
  const emailService = new LoggerEmailService();
  const demographicDataProvider = new MockDemographicDataProvider();

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
  // UseCases - Trade Area
  // ============================================
  const createTradeAreaUseCase = new CreateTradeAreaUseCase(tradeAreaRepository);
  const getTradeAreaUseCase = new GetTradeAreaUseCase(tradeAreaRepository);
  const listTradeAreasUseCase = new ListTradeAreasUseCase(tradeAreaRepository);
  const deleteTradeAreaUseCase = new DeleteTradeAreaUseCase(tradeAreaRepository);
  const updateTradeAreaUseCase = new UpdateTradeAreaUseCase(tradeAreaRepository);
  const getDemographicsUseCase = new GetDemographicsUseCase(
    tradeAreaRepository,
    demographicDataProvider
  );

  // ============================================
  // UseCases - Store
  // ============================================
  const createStoreUseCase = new CreateStoreUseCase(storeRepository);
  const getStoreUseCase = new GetStoreUseCase(storeRepository);
  const listStoresUseCase = new ListStoresUseCase(storeRepository);
  const deleteStoreUseCase = new DeleteStoreUseCase(storeRepository);
  const updateStoreUseCase = new UpdateStoreUseCase(storeRepository);

  // ============================================
  // UseCases - Competitor
  // ============================================
  const createCompetitorUseCase = new CreateCompetitorUseCase(
    competitorRepository,
    storeRepository
  );
  const getCompetitorUseCase = new GetCompetitorUseCase(competitorRepository, storeRepository);
  const listCompetitorsByStoreUseCase = new ListCompetitorsByStoreUseCase(
    competitorRepository,
    storeRepository
  );
  const deleteCompetitorUseCase = new DeleteCompetitorUseCase(
    competitorRepository,
    storeRepository
  );
  const updateCompetitorUseCase = new UpdateCompetitorUseCase(
    competitorRepository,
    storeRepository
  );

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
  const tradeAreaController = new TradeAreaController(
    createTradeAreaUseCase,
    getTradeAreaUseCase,
    listTradeAreasUseCase,
    deleteTradeAreaUseCase,
    updateTradeAreaUseCase,
    getDemographicsUseCase,
    validationMiddleware
  );
  const storeController = new StoreController(
    createStoreUseCase,
    getStoreUseCase,
    listStoresUseCase,
    deleteStoreUseCase,
    updateStoreUseCase,
    validationMiddleware
  );
  const competitorController = new CompetitorController(
    createCompetitorUseCase,
    getCompetitorUseCase,
    listCompetitorsByStoreUseCase,
    deleteCompetitorUseCase,
    updateCompetitorUseCase,
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
  const csrfMiddleware = new CsrfMiddleware();

  return {
    userController,
    authController,
    profileController,
    deepPingController,
    tradeAreaController,
    storeController,
    competitorController,
    authMiddleware,
    securityMiddleware,
    corsMiddleware,
    rateLimitMiddleware,
    csrfMiddleware,
  };
}
