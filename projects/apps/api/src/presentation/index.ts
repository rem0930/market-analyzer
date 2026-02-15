/**
 * @what プレゼンテーション層のエクスポート
 * @why presentation層の公開APIを明示
 */

export { UserController } from './controllers/user-controller.js';
export { AuthController } from './controllers/auth-controller.js';
export { ProfileController } from './controllers/profile-controller.js';
export { DeepPingController } from './controllers/deep-ping-controller.js';
export { TradeAreaController } from './controllers/trade-area-controller.js';
export { StoreController } from './controllers/store-controller.js';
export { CompetitorController } from './controllers/competitor-controller.js';
export {
  AuthMiddleware,
  type AuthenticatedRequest,
  type AuthResult,
} from './middleware/auth-middleware.js';
export { SecurityMiddleware, type SecurityConfig } from './middleware/security-middleware.js';
export { CorsMiddleware, type CorsConfig } from './middleware/cors-middleware.js';
export { RateLimitMiddleware, type RateLimitConfig } from './middleware/rate-limit-middleware.js';
export { ValidationMiddleware } from './middleware/validation-middleware.js';
export { CsrfMiddleware, type CsrfConfig } from './middleware/csrf-middleware.js';
export { handleRoutes, type RouteContext } from './router.js';
export {
  type RouteDefinition,
  type RouteHandler,
  type AuthenticatedRouteHandler,
  type RouteOptions,
  type RouteFactoryContext,
  createRouteHandler,
  compileRoute,
  compileRoutes,
  matchRoute,
} from './route-factory.js';
export { createAuthRoutes } from './routes/auth.js';
export { createUserRoutes } from './routes/users.js';
export { createHealthRoutes } from './routes/health.js';
export { createTradeAreaRoutes } from './routes/trade-areas.js';
export { createStoreRoutes } from './routes/stores.js';
export { createCompetitorRoutes } from './routes/competitors.js';
