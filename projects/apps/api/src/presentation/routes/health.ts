/**
 * @what ヘルスチェック関連ルート定義
 * @why /health, /ping/*, / パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { DeepPingController } from '../controllers/deep-ping-controller.js';
import { sendJson } from '../middleware/error-handler.js';

/**
 * ヘルスチェック関連ルートを作成
 */
export function createHealthRoutes(deepPingController: DeepPingController): RouteDefinition[] {
  return [
    // Root endpoint
    {
      method: 'GET',
      path: '/',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        sendJson(res, 200, { name: '@monorepo/api', version: '0.0.1' }, params._requestId);
      },
    },
    // Health check endpoint
    {
      method: 'GET',
      path: '/health',
      handler: async (
        _req: IncomingMessage,
        res: ServerResponse,
        params: Record<string, string>
      ) => {
        sendJson(
          res,
          200,
          { status: 'ok', timestamp: new Date().toISOString() },
          params._requestId
        );
      },
    },
    // Deep ping endpoint (checks database connectivity)
    {
      method: 'GET',
      path: '/ping/deep',
      handler: async (_req: IncomingMessage, res: ServerResponse) => {
        await deepPingController.deepPing(res);
      },
    },
  ];
}
