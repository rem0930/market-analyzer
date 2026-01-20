/**
 * @what リクエストID ミドルウェア
 * @why リクエスト追跡用 ID を生成・伝播し、ログとエラーレスポンスの相関を実現
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

const REQUEST_ID_HEADER = 'x-request-id';

/**
 * リクエスト ID を取得または生成
 *
 * クライアントから x-request-id ヘッダーが渡された場合はそれを使用し、
 * なければ新規 UUID を生成する。
 *
 * @param req - HTTP リクエスト
 * @returns リクエスト ID
 */
export function getRequestId(req: IncomingMessage): string {
  const existingId = req.headers[REQUEST_ID_HEADER];

  if (typeof existingId === 'string' && existingId.length > 0) {
    return existingId;
  }

  return crypto.randomUUID();
}

/**
 * レスポンスに x-request-id ヘッダーを付与
 *
 * @param res - HTTP レスポンス
 * @param requestId - リクエスト ID
 */
export function setRequestIdHeader(res: ServerResponse, requestId: string): void {
  res.setHeader(REQUEST_ID_HEADER, requestId);
}
