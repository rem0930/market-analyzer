/**
 * @what カスタム HTTP クライアント（orval の mutator 用）
 * @why baseURL、認証、エラーハンドリングを一元化
 *
 * RFC 7807 (Problem Details for HTTP APIs) 互換のエラーハンドリングを実装
 */

/**
 * アプリケーション共通エラーコード
 */
export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'CONFLICT'
  | 'RATE_LIMIT'
  | 'EXTERNAL_SERVICE_ERROR'
  | 'INTERNAL_ERROR';

/**
 * エラーの下位理由
 */
export type ErrorReason =
  | 'INVALID_FORMAT'
  | 'REQUIRED_FIELD'
  | 'TOO_SHORT'
  | 'TOO_LONG'
  | 'INVALID_EMAIL'
  | 'WEAK_PASSWORD'
  | 'INVALID_VALUE'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'SESSION_EXPIRED'
  | 'RESOURCE_NOT_FOUND'
  | 'USER_NOT_FOUND'
  | 'EMAIL_EXISTS'
  | 'ALREADY_EXISTS'
  | 'TOO_MANY_REQUESTS'
  | 'SERVICE_UNAVAILABLE'
  | 'TIMEOUT';

/**
 * バリデーションエラー詳細
 */
export interface ErrorItem {
  field: string;
  code: string;
  messageKey?: string;
}

/**
 * RFC 7807 互換 API エラーレスポンス
 */
export interface ApiErrorResponse {
  type: string;
  title: string;
  status: number;
  code: ErrorCode;
  requestId: string;
  reason?: ErrorReason;
  messageKey?: string;
  messageParams?: Record<string, unknown>;
  errors?: ErrorItem[];
}

export interface FetchOptions extends Omit<RequestInit, 'body'> {
  body?: unknown;
}

/**
 * 正規化された API エラー
 *
 * RFC 7807 互換のエラー情報を保持
 */
export class NormalizedApiError extends Error {
  /** エラー種別 URI */
  readonly type: string;
  /** エラータイトル */
  readonly title: string;
  /** HTTP ステータスコード */
  readonly status: number;
  /** アプリケーションエラーコード */
  readonly code: ErrorCode;
  /** リクエスト追跡用 ID */
  readonly requestId: string;
  /** エラー理由 */
  readonly reason?: ErrorReason;
  /** i18n メッセージキー */
  readonly messageKey?: string;
  /** i18n メッセージパラメータ */
  readonly messageParams?: Record<string, unknown>;
  /** バリデーションエラー詳細 */
  readonly errors?: ErrorItem[];

  constructor(response: ApiErrorResponse) {
    super(response.title);
    this.name = 'NormalizedApiError';
    this.type = response.type;
    this.title = response.title;
    this.status = response.status;
    this.code = response.code;
    this.requestId = response.requestId;
    this.reason = response.reason;
    this.messageKey = response.messageKey;
    this.messageParams = response.messageParams;
    this.errors = response.errors;
  }

  /**
   * 特定のエラーコードかチェック
   */
  is(code: ErrorCode): boolean {
    return this.code === code;
  }

  /**
   * 認証エラーかチェック
   */
  isUnauthorized(): boolean {
    return this.code === 'UNAUTHORIZED';
  }

  /**
   * バリデーションエラーかチェック
   */
  isValidationError(): boolean {
    return this.code === 'VALIDATION_ERROR';
  }

  /**
   * 特定フィールドのエラーを取得
   */
  getFieldError(field: string): ErrorItem | undefined {
    return this.errors?.find((e) => e.field === field);
  }
}

// 実行時に設定される baseURL（アプリ側で設定）
let _baseUrl = 'http://localhost:3001';
let _getAuthToken: (() => string | null) | undefined;

/**
 * API クライアントの設定を初期化
 */
export function configureApiClient(options: {
  baseUrl: string;
  getAuthToken?: () => string | null;
}) {
  _baseUrl = options.baseUrl;
  _getAuthToken = options.getAuthToken;
}

/**
 * エラーレスポンスを ApiErrorResponse にパース
 */
function parseErrorResponse(status: number, body: unknown, requestId: string): ApiErrorResponse {
  // RFC 7807 形式のレスポンスを想定
  if (typeof body === 'object' && body !== null) {
    const data = body as Record<string, unknown>;

    // 新形式（RFC 7807 互換）
    if (data.code && data.type && data.title) {
      return {
        type: String(data.type),
        title: String(data.title),
        status: typeof data.status === 'number' ? data.status : status,
        code: data.code as ErrorCode,
        requestId: typeof data.requestId === 'string' ? data.requestId : requestId,
        reason: data.reason as ErrorReason | undefined,
        messageKey: data.messageKey as string | undefined,
        messageParams: data.messageParams as Record<string, unknown> | undefined,
        errors: data.errors as ErrorItem[] | undefined,
      };
    }

    // 旧形式（後方互換性）
    if (data.code) {
      return {
        type: 'about:blank',
        title: typeof data.message === 'string' ? data.message : `HTTP Error: ${status}`,
        status,
        code: data.code as ErrorCode,
        requestId,
      };
    }
  }

  // フォールバック
  return {
    type: 'about:blank',
    title: `HTTP Error: ${status}`,
    status,
    code: status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
    requestId,
  };
}

/**
 * Orval の mutator として使用するカスタム fetch
 */
export async function customFetch<T>(url: string, options: FetchOptions = {}): Promise<T> {
  const { body, headers: customHeaders, ...rest } = options;

  const fullUrl = url.startsWith('http') ? url : `${_baseUrl}${url}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(customHeaders as Record<string, string>),
  };

  // 認証トークンがあれば追加
  const token = _getAuthToken?.();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(fullUrl, {
    ...rest,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  // レスポンスから requestId を取得
  const requestId = response.headers.get('x-request-id') ?? crypto.randomUUID();

  if (!response.ok) {
    const errorBody: unknown = await response.json().catch(() => ({}));
    const errorResponse = parseErrorResponse(response.status, errorBody, requestId);
    throw new NormalizedApiError(errorResponse);
  }

  // 204 No Content の場合
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
