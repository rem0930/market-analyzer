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
 * HTTP ラッパー
 * fetch を直接使わず、このラッパー経由でリクエストを行う
 */
export async function apiClient<T>(
  path: string,
  options: RequestInit & ApiClientConfig = {}
): Promise<T> {
  const config = getConfig();
  const { baseUrl = config.apiBaseUrl, headers: customHeaders, ...fetchOptions } = options;

  const url = `${baseUrl}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };

  // 認証トークンがあれば追加（実際の実装では shared/lib から取得）
  const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...fetchOptions,
    headers,
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
