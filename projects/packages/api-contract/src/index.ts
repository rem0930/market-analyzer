/**
 * @what API Contract パッケージのエントリポイント
 * @why OpenAPI 生成物と設定を一元的にエクスポート
 */

// HTTP クライアント設定
export { configureApiClient, customFetch, NormalizedApiError, type ApiError } from './http-client';

// 生成物（orval 実行後に有効になる）
// export * from './generated/api';
// export * from './generated/schemas';

// プレースホルダー（初回は生成前なので型のみ提供）
export interface GeneratedPlaceholder {
  _notice: 'Run `pnpm openapi:generate` to generate API types';
}
