/**
 * @what インフラストラクチャ層のエクスポート
 * @why infrastructure層の公開APIを明示
 */

// In-memory repositories (dev/test)
export { InMemoryUserRepository } from './repositories/in-memory-user-repository.js';
export { InMemoryAuthUserRepository } from './repositories/in-memory-auth-user-repository.js';
export { InMemoryRefreshTokenRepository } from './repositories/in-memory-refresh-token-repository.js';
export { InMemoryPasswordResetTokenRepository } from './repositories/in-memory-password-reset-token-repository.js';

// Prisma repositories (production)
export { PrismaUserRepository } from './repositories/prisma-user-repository.js';
export { PrismaAuthUserRepository } from './repositories/prisma-auth-user-repository.js';
export { PrismaRefreshTokenRepository } from './repositories/prisma-refresh-token-repository.js';
export { PrismaPasswordResetTokenRepository } from './repositories/prisma-password-reset-token-repository.js';

// Database
export { prisma } from './database/index.js';

// Services (implementations only - interfaces are in domain layer)
export { BcryptPasswordService } from './services/password-service.js';
export { CryptoTokenHashService } from './services/token-hash-service.js';
export { LoggerEmailService } from './services/email-service.js';

export {
  JwtServiceImpl,
  type JwtService,
  type JwtServiceConfig,
  type JwtPayload,
  type TokenPair,
  type JwtServiceError,
} from './services/jwt-service.js';

// Trade Area repositories
export { InMemoryTradeAreaRepository } from './repositories/in-memory-trade-area-repository.js';
export { PrismaTradeAreaRepository } from './repositories/prisma-trade-area-repository.js';

// Trade Area services
export { MockDemographicDataProvider } from './services/mock-demographic-data-provider.js';

// Store repositories
export { InMemoryStoreRepository } from './repositories/in-memory-store-repository.js';
export { PrismaStoreRepository } from './repositories/prisma-store-repository.js';

// Competitor repositories
export { InMemoryCompetitorRepository } from './repositories/in-memory-competitor-repository.js';
export { PrismaCompetitorRepository } from './repositories/prisma-competitor-repository.js';

// Health checkers
export { PrismaDatabaseHealthChecker } from './health/index.js';

// Logger
export { logger, type LogLevel } from './logger/index.js';
