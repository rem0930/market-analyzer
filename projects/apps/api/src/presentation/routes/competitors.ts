/**
 * @what 競合店舗関連ルート定義
 * @why /stores/:storeId/competitors, /competitors/* パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { CompetitorController } from '../controllers/competitor-controller.js';
import type { AuthenticatedRequest } from '../middleware/auth-middleware.js';

export function createCompetitorRoutes(
  competitorController: CompetitorController
): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: '/stores/:storeId/competitors',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.create(req, res, params.storeId, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/stores/:storeId/competitors',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.listByStore(
          _req,
          res,
          params.storeId,
          user.userId,
          params._requestId
        );
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/competitors/:id',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.getById(_req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'PATCH',
      path: '/competitors/:id',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.update(req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'DELETE',
      path: '/competitors/:id',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.delete(_req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'POST',
      path: '/stores/:storeId/competitors/search',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.search(req, res, params.storeId, user.userId, params._requestId);
      },
      options: { auth: true, rateLimit: true },
    },
    {
      method: 'POST',
      path: '/stores/:storeId/competitors/bulk',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await competitorController.bulkCreate(
          req,
          res,
          params.storeId,
          user.userId,
          params._requestId
        );
      },
      options: { auth: true, rateLimit: true },
    },
  ];
}
