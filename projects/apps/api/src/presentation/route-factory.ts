/**
 * @what ルートファクトリ
 * @why ルート定義時に認証・エラーハンドリングを自動ラップし、一貫した処理を保証
 *
 * presentation層のルール:
 * - usecase層のみimport可能
 * - domain層、infrastructure層を直接importしない（loggerは例外的に許可）
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import type { AuthMiddleware, AuthenticatedRequest } from './middleware/auth-middleware.js';
import type { RateLimitMiddleware } from './middleware/rate-limit-middleware.js';
import { logger } from '../infrastructure/logger/index.js';

/**
 * ルートハンドラの型（認証なし）
 */
export type RouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>
) => Promise<void>;

/**
 * ルートハンドラの型（認証あり）
 */
export type AuthenticatedRouteHandler = (
  req: IncomingMessage,
  res: ServerResponse,
  params: Record<string, string>,
  user: AuthenticatedRequest
) => Promise<void>;

/**
 * ルートオプション
 */
export interface RouteOptions {
  /** 認証必須 */
  auth?: boolean;
  /** レート制限適用 */
  rateLimit?: boolean;
}

/**
 * ルート定義
 */
export interface RouteDefinition {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  path: string;
  handler: RouteHandler | AuthenticatedRouteHandler;
  options?: RouteOptions;
}

/**
 * コンパイル済みルート（内部用）
 */
export interface CompiledRoute {
  method: string;
  pattern: RegExp;
  paramNames: string[];
  handler: (
    req: IncomingMessage,
    res: ServerResponse,
    params: Record<string, string>
  ) => Promise<void>;
}

/**
 * ルートファクトリのコンテキスト
 */
export interface RouteFactoryContext {
  authMiddleware: AuthMiddleware;
  rateLimitMiddleware: RateLimitMiddleware;
}

/**
 * 内部エラーレスポンスを送信
 */
function sendInternalError(res: ServerResponse): void {
  if (!res.headersSent) {
    res.writeHead(500, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 'INTERNAL_ERROR', message: 'Internal Server Error' }));
  }
}

/**
 * ルートハンドラを作成（ミドルウェアラッピング付き）
 */
export function createRouteHandler(
  definition: RouteDefinition,
  context: RouteFactoryContext
): (req: IncomingMessage, res: ServerResponse, params: Record<string, string>) => Promise<void> {
  return async (req, res, params) => {
    try {
      // レート制限チェック
      if (definition.options?.rateLimit) {
        if (context.rateLimitMiddleware.check(req, res)) {
          return;
        }
      }

      // 認証チェック
      if (definition.options?.auth) {
        const authResult = context.authMiddleware.authenticate(req);
        if (!authResult.authenticated) {
          context.authMiddleware.sendUnauthorized(res, authResult.error);
          return;
        }
        await (definition.handler as AuthenticatedRouteHandler)(req, res, params, authResult.user);
        return;
      }

      // 認証不要ルート
      await (definition.handler as RouteHandler)(req, res, params);
    } catch (error) {
      logger.error('Unhandled error in route handler', {
        error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
        method: req.method,
        path: req.url,
      });
      sendInternalError(res);
    }
  };
}

/**
 * ルート定義をコンパイル
 * パスパラメータ（:id など）を正規表現に変換
 */
export function compileRoute(
  definition: RouteDefinition,
  context: RouteFactoryContext
): CompiledRoute {
  const paramNames: string[] = [];
  const patternStr = definition.path.replace(/:([^/]+)/g, (_, name) => {
    paramNames.push(name);
    return '([^/]+)';
  });
  const pattern = new RegExp(`^${patternStr}$`);

  return {
    method: definition.method,
    pattern,
    paramNames,
    handler: createRouteHandler(definition, context),
  };
}

/**
 * 複数のルート定義をコンパイル
 */
export function compileRoutes(
  definitions: RouteDefinition[],
  context: RouteFactoryContext
): CompiledRoute[] {
  return definitions.map((def) => compileRoute(def, context));
}

/**
 * ルートをマッチング
 * @returns マッチしたルートとパラメータ、またはnull
 */
export function matchRoute(
  routes: CompiledRoute[],
  method: string,
  pathname: string
): { route: CompiledRoute; params: Record<string, string> } | null {
  for (const route of routes) {
    if (route.method !== method) continue;
    const match = pathname.match(route.pattern);
    if (!match) continue;

    const params: Record<string, string> = {};
    route.paramNames.forEach((name, i) => {
      params[name] = match[i + 1];
    });

    return { route, params };
  }
  return null;
}
