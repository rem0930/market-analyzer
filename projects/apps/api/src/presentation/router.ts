/**
 * @what HTTPルーター
 * @why URLパスとHTTPメソッドをコントローラーにディスパッチ
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない（loggerは例外的に許可）
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { UserController } from './controllers/user-controller.js';
import type { AuthController } from './controllers/auth-controller.js';
import type { ProfileController } from './controllers/profile-controller.js';
import type { DeepPingController } from './controllers/deep-ping-controller.js';
import type { TradeAreaController } from './controllers/trade-area-controller.js';
import type { AuthMiddleware } from './middleware/auth-middleware.js';
import type { SecurityMiddleware } from './middleware/security-middleware.js';
import type { CorsMiddleware } from './middleware/cors-middleware.js';
import type { RateLimitMiddleware } from './middleware/rate-limit-middleware.js';
import type { CsrfMiddleware } from './middleware/csrf-middleware.js';
import { AppError } from '@monorepo/shared';
import { getRequestId, setRequestIdHeader } from './middleware/request-id-middleware.js';
import { sendErrorResponse } from './middleware/error-handler.js';
import {
  compileRoutes,
  matchRoute,
  type CompiledRoute,
  type RouteFactoryContext,
} from './route-factory.js';
import { createAuthRoutes } from './routes/auth.js';
import { createUserRoutes } from './routes/users.js';
import { createHealthRoutes } from './routes/health.js';
import { createTradeAreaRoutes } from './routes/trade-areas.js';

export interface RouteContext {
  userController: UserController;
  authController: AuthController;
  profileController: ProfileController;
  deepPingController: DeepPingController;
  tradeAreaController: TradeAreaController;
  authMiddleware: AuthMiddleware;
  securityMiddleware: SecurityMiddleware;
  corsMiddleware: CorsMiddleware;
  rateLimitMiddleware: RateLimitMiddleware;
  csrfMiddleware: CsrfMiddleware;
}

/**
 * コンパイル済みルートをキャッシュ
 * ルートは起動時に一度だけコンパイルされる
 */
let cachedRoutes: CompiledRoute[] | null = null;

/**
 * 全ルートを取得・コンパイル
 */
function getCompiledRoutes(context: RouteContext): CompiledRoute[] {
  if (cachedRoutes) {
    return cachedRoutes;
  }

  const factoryContext: RouteFactoryContext = {
    authMiddleware: context.authMiddleware,
    rateLimitMiddleware: context.rateLimitMiddleware,
  };

  // 全ルートモジュールからルート定義を収集
  const allRouteDefinitions = [
    ...createHealthRoutes(context.deepPingController),
    ...createAuthRoutes(context.authController),
    ...createUserRoutes(context.userController, context.profileController),
    ...createTradeAreaRoutes(context.tradeAreaController),
  ];

  // ルートをコンパイルしてキャッシュ
  cachedRoutes = compileRoutes(allRouteDefinitions, factoryContext);
  return cachedRoutes;
}

/**
 * ルートハンドラー
 */
export async function handleRoutes(
  req: IncomingMessage,
  res: ServerResponse,
  context: RouteContext
): Promise<void> {
  const { securityMiddleware, corsMiddleware, csrfMiddleware } = context;

  // リクエストIDを取得・設定（全レスポンスに付与）
  const requestId = getRequestId(req);
  setRequestIdHeader(res, requestId);

  // セキュリティヘッダーを全レスポンスに付与
  securityMiddleware.applyHeaders(res);

  // CORS 処理（プリフライトの場合はここで終了）
  if (corsMiddleware.handle(req, res)) {
    return;
  }

  // CSRF トークン: GETリクエストでトークンをcookieに設定
  const method = req.method ?? 'GET';
  if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
    const token = csrfMiddleware.generateToken();
    csrfMiddleware.setTokenCookie(res, token);
  }

  // CSRF 検証（GETリクエストと除外パスはスキップ）
  if (!csrfMiddleware.verify(req, res)) {
    return;
  }

  const url = new URL(req.url ?? '/', `http://localhost`);
  const pathname = url.pathname;

  // コンパイル済みルートを取得
  const routes = getCompiledRoutes(context);

  // マッチするルートを検索
  const matched = matchRoute(routes, method, pathname);
  if (matched) {
    // requestId を params に注入してハンドラに渡す
    const paramsWithRequestId = { ...matched.params, _requestId: requestId };
    await matched.route.handler(req, res, paramsWithRequestId);
    return;
  }

  // 404 - 統一エラー形式で返却
  sendErrorResponse(res, requestId, AppError.notFound('RESOURCE_NOT_FOUND'));
}
