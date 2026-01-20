/**
 * @what 構造化ロガー
 * @why 構造化ログ出力でデバッグ・監視を容易に
 *
 * Features:
 * - JSON 形式の構造化ログ
 * - ファイル出力（LOG_FILE_ENABLED=true で有効化）
 * - 機密情報の自動サニタイズ
 * - ログローテーション
 */

import { sanitize } from './sanitizer.js';
import { FileTransport, createFileTransport } from './file-transport.js';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: Record<string, unknown>;
}

export interface Logger {
  debug(message: string, context?: Record<string, unknown>): void;
  info(message: string, context?: Record<string, unknown>): void;
  warn(message: string, context?: Record<string, unknown>): void;
  error(message: string, context?: Record<string, unknown>): void;
}

export interface LoggerOptions {
  /** 最小ログレベル */
  minLevel?: LogLevel;
  /** ファイル出力を有効化 */
  fileEnabled?: boolean;
  /** ログディレクトリ */
  logDir?: string;
  /** コンテキストのサニタイズを有効化 */
  sanitizeEnabled?: boolean;
}

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

/**
 * ロガーを作成
 */
function createLogger(options: LoggerOptions = {}): Logger {
  const {
    minLevel = 'info',
    fileEnabled = false,
    logDir = './logs/api',
    sanitizeEnabled = true,
  } = options;

  const minLevelValue = LOG_LEVELS[minLevel];

  // ファイルトランスポートの初期化
  let combinedTransport: FileTransport | null = null;
  let errorTransport: FileTransport | null = null;

  if (fileEnabled) {
    combinedTransport = createFileTransport({
      directory: logDir,
      filename: 'combined.log',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    });

    errorTransport = createFileTransport({
      directory: logDir,
      filename: 'error.log',
      maxSize: 10 * 1024 * 1024, // 10MB
      maxFiles: 5,
    });
  }

  function log(level: LogLevel, message: string, context?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < minLevelValue) return;

    // コンテキストをサニタイズ
    const sanitizedContext = context && sanitizeEnabled ? sanitize(context) : context;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      ...(sanitizedContext && { context: sanitizedContext }),
    };

    const output = JSON.stringify(entry);

    // コンソール出力
    if (level === 'error') {
      process.stderr.write(output + '\n');
    } else {
      process.stdout.write(output + '\n');
    }

    // ファイル出力
    if (combinedTransport) {
      combinedTransport.write(output);
    }

    if (level === 'error' && errorTransport) {
      errorTransport.write(output);
    }
  }

  return {
    debug: (message, context) => log('debug', message, context),
    info: (message, context) => log('info', message, context),
    warn: (message, context) => log('warn', message, context),
    error: (message, context) => log('error', message, context),
  };
}

// 環境変数から設定を読み込み
const logLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';
const fileEnabled = process.env.LOG_FILE_ENABLED === 'true';
const logDir = process.env.LOG_DIR || './logs/api';

export const logger = createLogger({
  minLevel: logLevel,
  fileEnabled,
  logDir,
  sanitizeEnabled: true,
});

// 再エクスポート
export { sanitize, sanitizeError } from './sanitizer.js';
export { FileTransport, createFileTransport } from './file-transport.js';
export { createLogger };
