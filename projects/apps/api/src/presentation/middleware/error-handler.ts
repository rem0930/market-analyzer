/**
 * @what 統一エラーハンドラ
 * @why RFC 7807 互換の統一エラーレスポンス形式を提供
 *
 * AppError を ApiError 形式に変換してレスポンスを返す。
 * 想定外のエラーは詳細を隠蔽し、INTERNAL_ERROR として返す。
 */

import type { ServerResponse } from 'node:http';
import { AppError } from '@monorepo/shared';
import { logger } from '../../infrastructure/logger/index.js';

const CONTENT_TYPE_PROBLEM_JSON = 'application/problem+json';

/**
 * エラーレスポンスを送信
 *
 * @param res - HTTP レスポンス
 * @param requestId - リクエスト追跡用 ID
 * @param error - AppError インスタンス
 */
export function sendErrorResponse(res: ServerResponse, requestId: string, error: AppError): void {
  const apiError = error.toApiError(requestId);

  res.writeHead(apiError.status, {
    'Content-Type': CONTENT_TYPE_PROBLEM_JSON,
    'x-request-id': requestId,
  });
  res.end(JSON.stringify(apiError));
}

/**
 * 想定外エラーを処理
 *
 * エラーをログに記録し、詳細を隠蔽した INTERNAL_ERROR を返す。
 *
 * @param res - HTTP レスポンス
 * @param requestId - リクエスト追跡用 ID
 * @param error - 任意のエラー
 */
export function handleUnexpectedError(
  res: ServerResponse,
  requestId: string,
  error: unknown
): void {
  // エラーをログに記録（詳細はサーバーログのみ）
  logger.error('Unexpected error occurred', {
    requestId,
    error: error instanceof Error ? error.message : String(error),
    stack: error instanceof Error ? error.stack : undefined,
  });

  const appError = AppError.fromUnknown(error);
  sendErrorResponse(res, requestId, appError);
}

/**
 * コントローラー実行をラップしてエラーを統一処理
 *
 * @param res - HTTP レスポンス
 * @param requestId - リクエスト追跡用 ID
 * @param handler - コントローラーハンドラ関数
 *
 * @example
 * ```typescript
 * await withErrorHandler(res, requestId, async () => {
 *   const result = await useCase.execute(input);
 *   if (result.isFailure()) {
 *     throw new AppError('VALIDATION_ERROR', { reason: 'INVALID_EMAIL' });
 *   }
 *   sendJson(res, 200, result.value);
 * });
 * ```
 */
export async function withErrorHandler(
  res: ServerResponse,
  requestId: string,
  handler: () => Promise<void>
): Promise<void> {
  try {
    await handler();
  } catch (error) {
    if (error instanceof AppError) {
      sendErrorResponse(res, requestId, error);
    } else {
      handleUnexpectedError(res, requestId, error);
    }
  }
}

/**
 * AppError を生成するヘルパー関数群
 *
 * コントローラーから直接使用できるショートカット
 */
export const errors = {
  validation: AppError.validation.bind(AppError),
  unauthorized: AppError.unauthorized.bind(AppError),
  forbidden: AppError.forbidden.bind(AppError),
  notFound: AppError.notFound.bind(AppError),
  conflict: AppError.conflict.bind(AppError),
  rateLimit: AppError.rateLimit.bind(AppError),
} as const;

/**
 * 成功レスポンスを送信
 *
 * @param res - HTTP レスポンス
 * @param status - HTTP ステータスコード
 * @param data - レスポンスデータ
 * @param requestId - リクエスト追跡用 ID
 */
export function sendJson(
  res: ServerResponse,
  status: number,
  data: unknown,
  requestId: string
): void {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'x-request-id': requestId,
  });
  res.end(JSON.stringify(data));
}

/**
 * 204 No Content レスポンスを送信
 *
 * @param res - HTTP レスポンス
 * @param requestId - リクエスト追跡用 ID
 */
export function sendNoContent(res: ServerResponse, requestId: string): void {
  res.writeHead(204, { 'x-request-id': requestId });
  res.end();
}
