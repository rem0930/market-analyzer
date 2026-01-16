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

export interface RouteContext {
  userController: UserController;
}

/**
 * ルートハンドラー
 */
export async function handleRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  context: RouteContext
): Promise<void> {
  const { userController } = context;
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
  res.end(JSON.stringify({ error: 'Not Found' }));
}
