/**
 * @what ログサニタイザー
 * @why 機密情報（パスワード、トークン、PII）をログから除去
 */

/**
 * サニタイズ対象のフィールド名パターン
 * 大文字小文字を区別しない
 */
const SENSITIVE_FIELD_PATTERNS = [
  'password',
  'secret',
  'token',
  'apikey',
  'api_key',
  'accesstoken',
  'access_token',
  'refreshtoken',
  'refresh_token',
  'jwt',
  'authorization',
  'privatekey',
  'private_key',
  'credential',
  'bearer',
];

/**
 * メールアドレスのパターン
 */
const EMAIL_PATTERN = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

/**
 * サニタイズ後の置換文字列
 */
const REDACTED = '[REDACTED]';

/**
 * フィールド名が機密情報かどうかを判定
 */
function isSensitiveField(fieldName: string): boolean {
  const lowerName = fieldName.toLowerCase();
  return SENSITIVE_FIELD_PATTERNS.some((pattern) => lowerName.includes(pattern));
}

/**
 * メールアドレスをマスク
 * user@example.com → u***@e***.com
 */
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return email;

  const domainParts = domain.split('.');
  const tld = domainParts.pop() || '';
  const domainName = domainParts.join('.');

  const maskedLocal = local.length > 0 ? `${local[0]}***` : '***';
  const maskedDomain = domainName.length > 0 ? `${domainName[0]}***` : '***';

  return `${maskedLocal}@${maskedDomain}.${tld}`;
}

/**
 * 値をサニタイズ
 */
function sanitizeValue(value: unknown, fieldName?: string): unknown {
  // null/undefined はそのまま
  if (value === null || value === undefined) {
    return value;
  }

  // フィールド名が機密情報の場合は REDACTED
  if (fieldName && isSensitiveField(fieldName)) {
    return REDACTED;
  }

  // 文字列の場合
  if (typeof value === 'string') {
    // メールアドレスの場合はマスク
    if (EMAIL_PATTERN.test(value)) {
      return maskEmail(value);
    }
    // JWT トークンのパターン（eyJ で始まる）
    if (value.startsWith('eyJ')) {
      return REDACTED;
    }
    // Bearer トークン
    if (value.toLowerCase().startsWith('bearer ')) {
      return REDACTED;
    }
    return value;
  }

  // 配列の場合は各要素を再帰的にサニタイズ
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeValue(item));
  }

  // オブジェクトの場合は各フィールドを再帰的にサニタイズ
  if (typeof value === 'object') {
    return sanitizeObject(value as Record<string, unknown>);
  }

  // その他の型（number, boolean など）はそのまま
  return value;
}

/**
 * オブジェクトを再帰的にサニタイズ
 */
function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    sanitized[key] = sanitizeValue(value, key);
  }

  return sanitized;
}

/**
 * ログコンテキストをサニタイズ
 *
 * @param context - サニタイズ対象のコンテキスト
 * @returns サニタイズ済みのコンテキスト
 *
 * @example
 * ```typescript
 * const sanitized = sanitize({
 *   userId: '123',
 *   email: 'user@example.com',
 *   password: 'secret123',
 *   token: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
 * });
 * // => {
 * //   userId: '123',
 * //   email: 'u***@e***.com',
 * //   password: '[REDACTED]',
 * //   token: '[REDACTED]',
 * // }
 * ```
 */
export function sanitize(context: Record<string, unknown>): Record<string, unknown> {
  return sanitizeObject(context);
}

/**
 * エラーオブジェクトをサニタイズ可能な形式に変換
 */
export function sanitizeError(error: unknown): Record<string, unknown> {
  if (error instanceof Error) {
    return {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
    };
  }

  if (typeof error === 'object' && error !== null) {
    return sanitize(error as Record<string, unknown>);
  }

  return { error: String(error) };
}
