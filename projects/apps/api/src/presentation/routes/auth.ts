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
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await controller.register(req, res, params._requestId);
      },
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/login',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await controller.login(req, res, params._requestId);
      },
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/refresh',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await controller.refresh(req, res, params._requestId);
      },
    },
    {
      method: 'POST',
      path: '/auth/forgot-password',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await controller.forgotPassword(req, res, params._requestId);
      },
      options: { rateLimit: true },
    },
    {
      method: 'POST',
      path: '/auth/reset-password',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await controller.resetPassword(req, res, params._requestId);
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
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await controller.logout(req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/auth/me',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await controller.getCurrentUser(req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
  ];
}
