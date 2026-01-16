/**
 * @layer shared
 * @segment config
 * @what 環境変数のラッパー
 *
 * process.env は直接使わず、このモジュール経由でアクセスする
 * 型安全性と一元管理を提供
 */

export interface AppConfig {
  apiBaseUrl: string;
  isDevelopment: boolean;
  isProduction: boolean;
}

/**
 * 環境変数を取得（必須）
 */
export function getEnvVar(key: string, fallback?: string): string {
  // Next.js の public env は NEXT_PUBLIC_ プレフィックス
  const value =
    (typeof process !== 'undefined' && process.env?.[key]) || fallback;

  if (!value) {
    throw new Error(`Missing required environment variable: ${key}`);
  }

  return value;
}

/**
 * 環境変数を取得（オプション）
 */
export function getOptionalEnvVar(key: string, fallback = ''): string {
  return (typeof process !== 'undefined' && process.env?.[key]) || fallback;
}

/**
 * アプリケーション設定を取得
 *
 * Note: Next.js replaces process.env.NEXT_PUBLIC_* at build time,
 * so we must reference them directly (not via dynamic key access).
 */
export function getConfig(): AppConfig {
  // NEXT_PUBLIC_API_URL is set by docker-compose.worktree.yml (Traefik endpoint)
  // Fall back to NEXT_PUBLIC_API_BASE_URL or localhost for local development
  const apiUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    'http://localhost:3001';

  return {
    apiBaseUrl: apiUrl,
    isDevelopment: process.env.NODE_ENV === 'development',
    isProduction: process.env.NODE_ENV === 'production',
  };
}
