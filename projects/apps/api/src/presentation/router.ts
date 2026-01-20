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
import type { CsrfMiddleware } from './middleware/csrf-middleware.js';
import { AppError } from '@monorepo/shared';
import { getRequestId, setRequestIdHeader } from './middleware/request-id-middleware.js';
import { sendErrorResponse, sendJson } from './middleware/error-handler.js';

/**
 * 認証エラーを AppError に変換
 */
function mapAuthErrorToAppError(
  error: 'missing_token' | 'invalid_token' | 'token_expired'
): AppError {
  switch (error) {
    case 'missing_token':
      return AppError.unauthorized('INVALID_TOKEN');
    case 'invalid_token':
      return AppError.unauthorized('INVALID_TOKEN');
    case 'token_expired':
      return AppError.unauthorized('TOKEN_EXPIRED');
  }
}

export interface RouteContext {
  userController: UserController;
  authController: AuthController;
  profileController: ProfileController;
  deepPingController: DeepPingController;
  authMiddleware: AuthMiddleware;
  securityMiddleware: SecurityMiddleware;
  corsMiddleware: CorsMiddleware;
  rateLimitMiddleware: RateLimitMiddleware;
  csrfMiddleware: CsrfMiddleware;
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
    csrfMiddleware,
  } = context;

  // リクエストIDを取得・設定（全レスポンスに付与）
  const requestId = getRequestId(req);
  setRequestIdHeader(res, requestId);

  // セキュリティヘッダーを全レスポンスに付与
  securityMiddleware.applyHeaders(res);

  // CORS 処理（プリフライトの場合はここで終了）
  if (corsMiddleware.handle(req, res)) {
    return;
  }

  // CSRF 検証（GETリクエストと除外パスはスキップ）
  if (!csrfMiddleware.verify(req, res)) {
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost`);
  const method = req.method ?? 'GET';
  const pathname = url.pathname;

  // Health check
  if (pathname === '/health' && method === 'GET') {
    sendJson(res, 200, { status: 'ok', timestamp: new Date().toISOString() }, requestId);
    return;
  }

  // Deep Ping - detailed health check including dependencies
  if (pathname === '/ping/deep' && method === 'GET') {
    await deepPingController.deepPing(res);
    return;
  }

  // Root
  if (pathname === '/' && method === 'GET') {
    sendJson(res, 200, { name: '@monorepo/api', version: '0.0.1' }, requestId);
    return;
  }

  // ============================================
  // Auth Routes (Public) - Rate Limited
  // ============================================

  // POST /auth/register
  if (pathname === '/auth/register' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.register(req, res, requestId);
    return;
  }

  // POST /auth/login
  if (pathname === '/auth/login' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.login(req, res, requestId);
    return;
  }

  // POST /auth/refresh
  if (pathname === '/auth/refresh' && method === 'POST') {
    await authController.refresh(req, res, requestId);
    return;
  }

  // POST /auth/forgot-password
  if (pathname === '/auth/forgot-password' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.forgotPassword(req, res, requestId);
    return;
  }

  // POST /auth/reset-password
  if (pathname === '/auth/reset-password' && method === 'POST') {
    if (rateLimitMiddleware.check(req, res)) return;
    await authController.resetPassword(req, res, requestId);
    return;
  }

  // ============================================
  // Auth Routes (Protected)
  // ============================================

  // POST /auth/logout
  if (pathname === '/auth/logout' && method === 'POST') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      sendErrorResponse(res, requestId, mapAuthErrorToAppError(authResult.error));
      return;
    }
    await authController.logout(req, res, authResult.user.userId, requestId);
    return;
  }

  // GET /auth/me
  if (pathname === '/auth/me' && method === 'GET') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      sendErrorResponse(res, requestId, mapAuthErrorToAppError(authResult.error));
      return;
    }
    await authController.getCurrentUser(req, res, authResult.user.userId, requestId);
    return;
  }

  // ============================================
  // Profile Routes (Protected)
  // ============================================

  // PATCH /users/me/name - Update name
  if (pathname === '/users/me/name' && method === 'PATCH') {
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      sendErrorResponse(res, requestId, mapAuthErrorToAppError(authResult.error));
      return;
    }
    await profileController.updateName(req, res, authResult.user.userId, requestId);
    return;
  }

  // PATCH /users/me/password - Update password (Rate Limited)
  if (pathname === '/users/me/password' && method === 'PATCH') {
    if (rateLimitMiddleware.check(req, res)) return;
    const authResult = authMiddleware.authenticate(req);
    if (!authResult.authenticated) {
      sendErrorResponse(res, requestId, mapAuthErrorToAppError(authResult.error));
      return;
    }
    await profileController.updatePassword(req, res, authResult.user.userId, requestId);
    return;
  }

  // ============================================
  // User Routes
  // ============================================

  // POST /users - Create user
  if (pathname === '/users' && method === 'POST') {
    await userController.createUser(req, res, requestId);
    return;
  }

  // GET /users/:id - Get user
  const userMatch = pathname.match(/^\/users\/([^/]+)$/);
  if (userMatch && method === 'GET') {
    await userController.getUser(req, res, userMatch[1], requestId);
    return;
  }

  // 404 - 統一エラー形式で返却
  sendErrorResponse(res, requestId, AppError.notFound('RESOURCE_NOT_FOUND'));
}
