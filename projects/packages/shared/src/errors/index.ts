/**
 * @what エラー関連モジュールのエクスポート
 * @why 統一されたエラーハンドリング機能の提供
 */

export {
  ERROR_CODES,
  ERROR_REASONS,
  ERROR_CODE_STATUS_MAP,
  ERROR_CODE_TITLE_MAP,
  getStatusForErrorCode,
  getTitleForErrorCode,
  type ErrorCode,
  type ErrorReason,
} from './error-codes.js';

export { AppError, type ApiError, type ErrorItem, type AppErrorOptions } from './app-error.js';
