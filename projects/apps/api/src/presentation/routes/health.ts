/**
 * @what ヘルスチェック関連ルート定義
 * @why /health, /ping/*, / パスのルートをモジュール化
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { RouteDefinition } from '../route-factory.js';
import type { DeepPingController } from '../controllers/deep-ping-controller.js';

/**
 * ヘルスチェック関連ルートを作成
 */
export function createHealthRoutes(deepPingController: DeepPingController): RouteDefinition[] {
  return [
    // Root endpoint
    {
      method: 'GET',
      path: '/',
      handler: async (_req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ name: '@monorepo/api', version: '0.0.1' }));
      },
    },
    // Health check endpoint
    {
      method: 'GET',
      path: '/health',
      handler: async (_req: IncomingMessage, res: ServerResponse) => {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }));
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
