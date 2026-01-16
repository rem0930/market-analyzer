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
function getEnvVar(key: string, fallback?: string): string {
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
function getOptionalEnvVar(key: string, fallback = ''): string {
  return (typeof process !== 'undefined' && process.env?.[key]) || fallback;
}

/**
 * アプリケーション設定を取得
 */
export function getConfig(): AppConfig {
  return {
    apiBaseUrl: getEnvVar('NEXT_PUBLIC_API_BASE_URL', 'http://localhost:3001'),
    isDevelopment: getOptionalEnvVar('NODE_ENV') === 'development',
    isProduction: getOptionalEnvVar('NODE_ENV') === 'production',
  };
}
