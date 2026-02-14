/**
 * @layer shared
 * @segment api
 * @what HTTP クライアントラッパー
 *
 * baseURL、認証ヘッダー、エラー正規化を一元管理
 * 生成クライアントはこのラッパーを使用する
 */
import { getConfig } from '@/shared/config';

export interface ApiClientConfig {
  baseUrl?: string;
  headers?: Record<string, string>;
}

export interface ApiError {
  status: number;
  message: string;
  code?: string;
  details?: unknown;
}

/**
 * 正規化されたAPIエラー
 */
export class NormalizedApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly code?: string,
    public readonly details?: unknown
  ) {
    super(message);
    this.name = 'NormalizedApiError';
  }
}

/**
 * Cookie から CSRF トークンを読み取る
 * Double Submit Cookie パターン用
 */
export function getCsrfToken(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|;\s*)csrf-token=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

/**
 * HTTP ラッパー
 * fetch を直接使わず、このラッパー経由でリクエストを行う
 */
export async function apiClient<T>(
  path: string,
  options: Omit<RequestInit, 'headers'> & ApiClientConfig = {}
): Promise<T> {
  const config = getConfig();
  const { baseUrl = config.apiBaseUrl, headers: customHeaders, ...fetchOptions } = options;

  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // 非 GET メソッドの場合、CSRF トークンを自動付与
  const method = (fetchOptions.method ?? 'GET').toUpperCase();
  if (method !== 'GET' && method !== 'HEAD' && method !== 'OPTIONS') {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      headers['x-csrf-token'] = csrfToken;
    }
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
    credentials: 'include',
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new NormalizedApiError(
      response.status,
      errorBody.message || `HTTP Error: ${response.status}`,
      errorBody.code,
      errorBody.details
    );
  }

  // 204 No Content の場合
  if (response.status === 204) {
    return undefined as T;
  }

  return response.json() as Promise<T>;
}
