/**
 * @what 店舗関連ルート定義
 * @why /stores/* パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { StoreController } from '../controllers/store-controller.js';
import type { AuthenticatedRequest } from '../middleware/auth-middleware.js';

export function createStoreRoutes(storeController: StoreController): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: '/stores',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await storeController.create(req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/stores',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await storeController.list(_req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/stores/:id',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await storeController.getById(_req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'PATCH',
      path: '/stores/:id',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await storeController.update(req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'DELETE',
      path: '/stores/:id',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await storeController.delete(_req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
  ];
}
