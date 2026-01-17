/**
 * @what HTTPルーター
 * @why URLパスとHTTPメソッドをコントローラーにディスパッチ
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UserController } from './controllers/user-controller.js';
import type { AuthController } from './controllers/auth-controller.js';
import type { ProfileController } from './controllers/profile-controller.js';
import type { DeepPingController } from './controllers/deep-ping-controller.js';
import type { AuthMiddleware } from './middleware/auth-middleware.js';
import type { SecurityMiddleware } from './middleware/security-middleware.js';
import type { CorsMiddleware } from './middleware/cors-middleware.js';
import type { RateLimitMiddleware } from './middleware/rate-limit-middleware.js';

export interface RouteContext {
  userController: UserController;
  authController: AuthController;
  profileController: ProfileController;
  deepPingController: DeepPingController;
  authMiddleware: AuthMiddleware;
  securityMiddleware: SecurityMiddleware;
  corsMiddleware: CorsMiddleware;
  rateLimitMiddleware: RateLimitMiddleware;
}

/**
 * ルートハンドラー
 */
export async function handleRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  context: RouteContext
): Promise<void> {
  const {
    userController,
    authController,
    profileController,
    deepPingController,
    authMiddleware,
    securityMiddleware,
    corsMiddleware,
    rateLimitMiddleware,
  } = context;

  // セキュリティヘッダーを全レスポンスに付与
  securityMiddleware.applyHeaders(res);

  // CORS 処理（プリフライトの場合はここで終了）
  if (corsMiddleware.handle(req, res)) {
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost`);
  const method = req.method ?? 'GET';
  const pathname = url.pathname;

  // Health check
  if (pathname === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Deep Ping - detailed health check including dependencies
  if (pathname === '/ping/deep' && method === 'GET') {
    await deepPingController.deepPing(res);
    return;
  }

  // Root
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: '@monorepo/api', version: '0.0.1' }));
    return;
  }

  // ============================================
  // Auth Routes (Public) - Rate Limited
  // ============================================

  // POST /auth/register
  if (pathname === '/auth/register' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.register(req, res);
    return;
  }

  // POST /auth/login
  if (pathname === '/auth/login' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.login(req, res);
    return;
  }

  // POST /auth/refresh
  if (pathname === '/auth/refresh' && method === 'POST') {
    await authController.refresh(req, res);
    return;
  }

  // POST /auth/forgot-password
  if (pathname === '/auth/forgot-password' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.forgotPassword(req, res);
    return;
  }

  // POST /auth/reset-password
  if (pathname === '/auth/reset-password' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.resetPassword(req, res);
    return;
  }

  // ============================================
  // Auth Routes (Protected)
  // ============================================

  // POST /auth/logout
  if (pathname === '/auth/logout' && method === 'POST') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      authMiddleware.sendUnauthorized(res, authResult.error);
      return;
    }
    await authController.logout(req, res, authResult.user.userId);
    return;
  }

  // GET /auth/me
  if (pathname === '/auth/me' && method === 'GET') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      authMiddleware.sendUnauthorized(res, authResult.error);
      return;
    }
    await authController.getCurrentUser(req, res, authResult.user.userId);
    return;
  }

  // ============================================
  // Profile Routes (Protected)
  // ============================================

  // PATCH /users/me/name - Update name
  if (pathname === '/users/me/name' && method === 'PATCH') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      authMiddleware.sendUnauthorized(res, authResult.error);
      return;
    }
    await profileController.updateName(req, res, authResult.user.userId);
    return;
  }

  // PATCH /users/me/password - Update password
  if (pathname === '/users/me/password' && method === 'PATCH') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      authMiddleware.sendUnauthorized(res, authResult.error);
      return;
    }
    await profileController.updatePassword(req, res, authResult.user.userId);
    return;
  }

  // ============================================
  // User Routes
  // ============================================

  // POST /users - Create user
  if (pathname === '/users' && method === 'POST') {
    await userController.createUser(req, res);
    return;
  }

  // GET /users/:id - Get user
  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === 'GET') {
    await userController.getUser(req, res, userMatch[1]);
    return;
  }

  // 404
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ code: 'NOT_FOUND', message: 'Not Found' }));
}
