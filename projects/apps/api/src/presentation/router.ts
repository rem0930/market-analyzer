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
import type { AuthMiddleware } from './middleware/auth-middleware.js';

export interface RouteContext {
  userController: UserController;
  authController: AuthController;
  authMiddleware: AuthMiddleware;
}

/**
 * ルートハンドラー
 */
export async function handleRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  context: RouteContext
): Promise<void> {
  const { userController, authController, authMiddleware } = context;
  const url = new URL(req.url ?? '/', `http://localhost`);
  const method = req.method ?? 'GET';
  const pathname = url.pathname;

  // Health check
  if (pathname === '/health' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
    return;
  }

  // Root
  if (pathname === '/' && method === 'GET') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ name: '@monorepo/api', version: '0.0.1' }));
    return;
  }

  // ============================================
  // Auth Routes (Public)
  // ============================================

  // POST /auth/register
  if (pathname === '/auth/register' && method === 'POST') {
    await authController.register(req, res);
    return;
  }

  // POST /auth/login
  if (pathname === '/auth/login' && method === 'POST') {
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
    await authController.forgotPassword(req, res);
    return;
  }

  // POST /auth/reset-password
  if (pathname === '/auth/reset-password' && method === 'POST') {
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
