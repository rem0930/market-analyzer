/**
 * @what エラーコード定義
 * @why アプリケーション全体で統一されたエラーコードを使用
 *
 * OpenAPI common.yaml の ErrorCode/ErrorReason と同期を維持すること
 */

/**
 * アプリケーション共通エラーコード
 * UI でのエラー分岐の主キーとして使用
 */
export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  RATE_LIMIT: 'RATE_LIMIT',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];

/**
 * エラーコードの下位理由
 * code の詳細を表現する列挙型
 */
export const ERROR_REASONS = {
  // Validation reasons
  INVALID_FORMAT: 'INVALID_FORMAT',
  REQUIRED_FIELD: 'REQUIRED_FIELD',
  TOO_SHORT: 'TOO_SHORT',
  TOO_LONG: 'TOO_LONG',
  INVALID_EMAIL: 'INVALID_EMAIL',
  WEAK_PASSWORD: 'WEAK_PASSWORD',
  INVALID_VALUE: 'INVALID_VALUE',
  // Auth reasons
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INVALID_TOKEN: 'INVALID_TOKEN',
  SESSION_EXPIRED: 'SESSION_EXPIRED',
  // Resource reasons
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  USER_NOT_FOUND: 'USER_NOT_FOUND',
  EMAIL_EXISTS: 'EMAIL_EXISTS',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  // Rate limit reasons
  TOO_MANY_REQUESTS: 'TOO_MANY_REQUESTS',
  // External service reasons
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const;

export type ErrorReason = (typeof ERROR_REASONS)[keyof typeof ERROR_REASONS];

/**
 * エラーコードとHTTPステータスの対応マップ
 */
export const ERROR_CODE_STATUS_MAP: Record<ErrorCode, number> = {
  [ERROR_CODES.VALIDATION_ERROR]: 400,
  [ERROR_CODES.UNAUTHORIZED]: 401,
  [ERROR_CODES.FORBIDDEN]: 403,
  [ERROR_CODES.NOT_FOUND]: 404,
  [ERROR_CODES.CONFLICT]: 409,
  [ERROR_CODES.RATE_LIMIT]: 429,
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 502,
  [ERROR_CODES.INTERNAL_ERROR]: 500,
};

/**
 * エラーコードとタイトルの対応マップ
 */
export const ERROR_CODE_TITLE_MAP: Record<ErrorCode, string> = {
  [ERROR_CODES.VALIDATION_ERROR]: 'Validation Error',
  [ERROR_CODES.UNAUTHORIZED]: 'Unauthorized',
  [ERROR_CODES.FORBIDDEN]: 'Forbidden',
  [ERROR_CODES.NOT_FOUND]: 'Not Found',
  [ERROR_CODES.CONFLICT]: 'Conflict',
  [ERROR_CODES.RATE_LIMIT]: 'Too Many Requests',
  [ERROR_CODES.EXTERNAL_SERVICE_ERROR]: 'Bad Gateway',
  [ERROR_CODES.INTERNAL_ERROR]: 'Internal Server Error',
};

/**
 * エラーコードからHTTPステータスを取得
 */
export function getStatusForErrorCode(code: ErrorCode): number {
  return ERROR_CODE_STATUS_MAP[code];
}

/**
 * エラーコードからタイトルを取得
 */
export function getTitleForErrorCode(code: ErrorCode): string {
  return ERROR_CODE_TITLE_MAP[code];
}
