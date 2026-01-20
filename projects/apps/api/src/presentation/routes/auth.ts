/**
 * @what 認証関連ルート定義
 * @why /auth/* パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { AuthController } from '../controllers/auth-controller.js';
import type { AuthenticatedRequest } from '../middleware/auth-middleware.js';

/**
 * 認証関連ルートを作成
 */
export function createAuthRoutes(controller: AuthController): RouteDefinition[] {
  return [
    // Public routes (with rate limiting)
    {
      method: 'POST',
      path: '/auth/register',
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        await controller.register(req, res);
      },
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        await controller.login(req, res);
      },
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/refresh',
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        await controller.refresh(req, res);
      },
    },
    {
      method: 'POST',
      path: '/auth/forgot-password',
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        await controller.forgotPassword(req, res);
      },
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/reset-password',
      handler: async (req: IncomingMessage, res: ServerResponse) => {
        await controller.resetPassword(req, res);
      },
      options: { rateLimit: true },
    },
    // Protected routes (require authentication)
    {
      method: 'POST',
      path: '/auth/logout',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        _params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await controller.logout(req, res, user.userId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        _params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await controller.getCurrentUser(req, res, user.userId);
      },
      options: { auth: true },
    },
  ];
}
