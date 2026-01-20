/**
 * @what ユーザー関連ルート定義
 * @why /users/* パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { UserController } from '../controllers/user-controller.js';
import type { ProfileController } from '../controllers/profile-controller.js';
import type { AuthenticatedRequest } from '../middleware/auth-middleware.js';

/**
 * ユーザー関連ルートを作成
 */
export function createUserRoutes(
  userController: UserController,
  profileController: ProfileController
): RouteDefinition[] {
  return [
    // Public routes
    {
      method: 'POST',
      path: '/users',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await userController.createUser(req, res, params._requestId);
      },
    },
    {
      method: 'GET',
      path: '/users/:id',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        await userController.getUser(req, res, params.id, params._requestId);
      },
    },
    // Protected routes (profile editing)
    {
      method: 'PATCH',
      path: '/users/me/name',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await profileController.updateName(req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'PATCH',
      path: '/users/me/password',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await profileController.updatePassword(req, res, user.userId, params._requestId);
      },
      options: { auth: true, rateLimit: true },
    },
  ];
}
