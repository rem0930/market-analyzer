/**
 * @what 商圏関連ルート定義
 * @why /trade-areas/* パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { TradeAreaController } from '../controllers/trade-area-controller.js';
import type { AuthenticatedRequest } from '../middleware/auth-middleware.js';

export function createTradeAreaRoutes(tradeAreaController: TradeAreaController): RouteDefinition[] {
  return [
    {
      method: 'POST',
      path: '/trade-areas',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await tradeAreaController.create(req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/trade-areas',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await tradeAreaController.list(_req, res, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/trade-areas/:id',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await tradeAreaController.getById(_req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'PATCH',
      path: '/trade-areas/:id',
      handler: async (
        req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await tradeAreaController.update(req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'DELETE',
      path: '/trade-areas/:id',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await tradeAreaController.delete(_req, res, params.id, user.userId, params._requestId);
      },
      options: { auth: true },
    },
    {
      method: 'GET',
      path: '/trade-areas/:id/demographics',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>,
        user: AuthenticatedRequest
      ) => {
        await tradeAreaController.getDemographics(
          _req,
          res,
          params.id,
          user.userId,
          params._requestId
        );
      },
      options: { auth: true },
    },
  ];
}
