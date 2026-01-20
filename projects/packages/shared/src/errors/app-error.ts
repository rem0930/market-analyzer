/**
 * @what アプリケーションエラークラス
 * @why 統一されたエラーハンドリングとAPI レスポンス形式の実現
 *
 * RFC 7807 (Problem Details for HTTP APIs) 互換の拡張形式をサポート
 */

import {
  type ErrorCode,
  type ErrorReason,
  ERROR_CODES,
  getStatusForErrorCode,
  getTitleForErrorCode,
} from './error-codes.js';

/**
 * バリデーションエラーの詳細項目
 */
export interface ErrorItem {
  /** エラーが発生したフィールド名 */
  field: string;
  /** フィールド固有のエラーコード */
  code: string;
  /** i18n メッセージキー（任意） */
  messageKey?: string;
}

/**
 * API エラーレスポンス形式（RFC 7807 互換）
 */
export interface ApiError {
  /** エラー種別 URI */
  type: string;
  /** エラーの大分類タイトル */
  title: string;
  /** HTTP ステータスコード */
  status: number;
  /** アプリケーションエラーコード */
  code: ErrorCode;
  /** リクエスト追跡用 ID */
  requestId: string;
  /** エラーの下位理由（任意） */
  reason?: ErrorReason;
  /** i18n メッセージキー（任意） */
  messageKey?: string;
  /** i18n メッセージパラメータ（任意） */
  messageParams?: Record<string, unknown>;
  /** バリデーションエラー詳細（任意） */
  errors?: ErrorItem[];
}

/**
 * AppError 構築オプション
 */
export interface AppErrorOptions {
  /** エラーの下位理由 */
  reason?: ErrorReason;
  /** i18n メッセージキー */
  messageKey?: string;
  /** i18n メッセージパラメータ */
  messageParams?: Record<string, unknown>;
  /** バリデーションエラー詳細 */
  errors?: ErrorItem[];
  /** 原因となったエラー */
  cause?: Error;
}

/**
 * アプリケーションエラークラス
 *
 * @example
 * ```typescript
 * // 単純なエラー
 * throw new AppError('UNAUTHORIZED');
 *
 * // 詳細付きエラー
 * throw new AppError('VALIDATION_ERROR', {
 *   reason: 'INVALID_EMAIL',
 *   errors: [{ field: 'email', code: 'INVALID_FORMAT' }],
 * });
 *
 * // API レスポンスへの変換
 * const apiError = error.toApiError('request-id-123');
 * ```
 */
export class AppError extends Error {
  /** アプリケーションエラーコード */
  readonly code: ErrorCode;
  /** HTTP ステータスコード */
  readonly status: number;
  /** エラーの下位理由 */
  readonly reason?: ErrorReason;
  /** i18n メッセージキー */
  readonly messageKey?: string;
  /** i18n メッセージパラメータ */
  readonly messageParams?: Record<string, unknown>;
  /** バリデーションエラー詳細 */
  readonly errors?: ErrorItem[];

  constructor(code: ErrorCode, options?: AppErrorOptions) {
    const title = getTitleForErrorCode(code);
    super(title, { cause: options?.cause });

    this.name = 'AppError';
    this.code = code;
    this.status = getStatusForErrorCode(code);
    this.reason = options?.reason;
    this.messageKey = options?.messageKey;
    this.messageParams = options?.messageParams;
    this.errors = options?.errors;

    // V8 スタックトレース最適化
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }

  /**
   * API レスポンス形式に変換
   *
   * @param requestId - リクエスト追跡用 ID
   * @returns RFC 7807 互換の ApiError オブジェクト
   */
  toApiError(requestId: string): ApiError {
    const apiError: ApiError = {
      type: 'about:blank',
      title: getTitleForErrorCode(this.code),
      status: this.status,
      code: this.code,
      requestId,
    };

    if (this.reason) {
      apiError.reason = this.reason;
    }

    if (this.messageKey) {
      apiError.messageKey = this.messageKey;
    }

    if (this.messageParams) {
      apiError.messageParams = this.messageParams;
    }

    if (this.errors && this.errors.length > 0) {
      apiError.errors = this.errors;
    }

    return apiError;
  }

  /**
   * 想定外エラーから AppError を生成
   * 詳細を隠蔽し、INTERNAL_ERROR として返す
   *
   * @param error - 元のエラー
   * @returns INTERNAL_ERROR の AppError
   */
  static fromUnknown(error: unknown): AppError {
    if (error instanceof AppError) {
      return error;
    }

    return new AppError(ERROR_CODES.INTERNAL_ERROR, {
      cause: error instanceof Error ? error : new Error(String(error)),
    });
  }

  /**
   * バリデーションエラーを生成
   *
   * @param errors - バリデーションエラー詳細
   * @param options - 追加オプション
   * @returns VALIDATION_ERROR の AppError
   */
  static validation(errors: ErrorItem[], options?: Omit<AppErrorOptions, 'errors'>): AppError {
    return new AppError(ERROR_CODES.VALIDATION_ERROR, {
      ...options,
      errors,
    });
  }

  /**
   * 認証エラーを生成
   *
   * @param reason - エラー理由
   * @param options - 追加オプション
   * @returns UNAUTHORIZED の AppError
   */
  static unauthorized(reason?: ErrorReason, options?: Omit<AppErrorOptions, 'reason'>): AppError {
    return new AppError(ERROR_CODES.UNAUTHORIZED, {
      ...options,
      reason,
    });
  }

  /**
   * 権限エラーを生成
   *
   * @param options - 追加オプション
   * @returns FORBIDDEN の AppError
   */
  static forbidden(options?: AppErrorOptions): AppError {
    return new AppError(ERROR_CODES.FORBIDDEN, options);
  }

  /**
   * 未発見エラーを生成
   *
   * @param reason - エラー理由（例: USER_NOT_FOUND）
   * @param options - 追加オプション
   * @returns NOT_FOUND の AppError
   */
  static notFound(reason?: ErrorReason, options?: Omit<AppErrorOptions, 'reason'>): AppError {
    return new AppError(ERROR_CODES.NOT_FOUND, {
      ...options,
      reason,
    });
  }

  /**
   * 競合エラーを生成
   *
   * @param reason - エラー理由（例: EMAIL_EXISTS）
   * @param options - 追加オプション
   * @returns CONFLICT の AppError
   */
  static conflict(reason?: ErrorReason, options?: Omit<AppErrorOptions, 'reason'>): AppError {
    return new AppError(ERROR_CODES.CONFLICT, {
      ...options,
      reason,
    });
  }

  /**
   * レート制限エラーを生成
   *
   * @param options - 追加オプション
   * @returns RATE_LIMIT の AppError
   */
  static rateLimit(options?: AppErrorOptions): AppError {
    return new AppError(ERROR_CODES.RATE_LIMIT, {
      ...options,
      reason: 'TOO_MANY_REQUESTS',
    });
  }
}
