/**
 * @what CSRF保護ミドルウェア
 * @why クロスサイトリクエストフォージェリ攻撃を防止
 *
 * Double Submit Cookie パターンを使用:
 * 1. サーバーがCSRFトークンをcookieに設定
 * 2. クライアントはリクエスト時にX-CSRF-Tokenヘッダーにトークンを含める
 * 3. サーバーはcookieとヘッダーのトークンが一致することを検証
 */

import type { IncomingMessage, ServerResponse } from 'node:http';
import crypto from 'node:crypto';

export interface CsrfConfig {
  /** トークンのバイト長 */
  tokenLength: number;
  /** Cookieの有効期限（秒） */
  cookieMaxAge: number;
  /** Cookie名 */
  cookieName: string;
  /** ヘッダー名 */
  headerName: string;
  /** 除外パス（CSRFチェックをスキップ） */
  excludePaths: string[];
  /** 本番環境かどうか */
  secure: boolean;
}

const DEFAULT_CONFIG: CsrfConfig = {
  tokenLength: 32,
  cookieMaxAge: 86400, // 24時間
  cookieName: 'csrf-token',
  headerName: 'x-csrf-token',
  excludePaths: [
    '/health',
    '/ping/deep',
    '/',
    '/auth/login',
    '/auth/register',
    '/auth/forgot-password',
    '/auth/reset-password',
    '/auth/refresh',
  ],
  secure: process.env.NODE_ENV === 'production',
};

export class CsrfMiddleware {
  private readonly config: CsrfConfig;

  constructor(config: Partial<CsrfConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * CSRFトークンを生成
   */
  generateToken(): string {
    return crypto.randomBytes(this.config.tokenLength).toString('hex');
  }

  /**
   * CSRFトークンをCookieに設定
   */
  setTokenCookie(res: ServerResponse, token: string): void {
    const cookieOptions = [
      `${this.config.cookieName}=${token}`,
      `Max-Age=${this.config.cookieMaxAge}`,
      'Path=/',
      'SameSite=Strict',
      'HttpOnly',
    ];

    if (this.config.secure) {
      cookieOptions.push('Secure');
    }

    res.setHeader('Set-Cookie', cookieOptions.join('; '));
  }

  /**
   * リクエストからCSRFトークンを検証
   * @returns true = 検証成功またはスキップ、false = 検証失敗
   */
  verify(req: IncomingMessage, res: ServerResponse): boolean {
    const method = req.method ?? 'GET';
    const url = new URL(req.url ?? '/', 'http://localhost');
    const pathname = url.pathname;

    // GETリクエストはCSRFチェック不要
    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      return true;
    }

    // 除外パスはスキップ
    if (this.config.excludePaths.includes(pathname)) {
      return true;
    }

    // Cookieからトークンを取得
    const cookieToken = this.getTokenFromCookie(req);
    // ヘッダーからトークンを取得
    const headerToken = this.getTokenFromHeader(req);

    // トークンが存在し、一致することを確認
    if (!cookieToken || !headerToken) {
      this.sendForbidden(res, 'CSRF token missing');
      return false;
    }

    // タイミング攻撃を防ぐため、timingSafeEqual を使用
    if (!this.safeCompare(cookieToken, headerToken)) {
      this.sendForbidden(res, 'CSRF token mismatch');
      return false;
    }

    return true;
  }

  /**
   * CookieからCSRFトークンを取得
   */
  private getTokenFromCookie(req: IncomingMessage): string | null {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return null;

    const cookies = cookieHeader.split(';').reduce(
      (acc, cookie) => {
        const [key, value] = cookie.trim().split('=');
        if (key && value) {
          acc[key] = value;
        }
        return acc;
      },
      {} as Record<string, string>
    );

    return cookies[this.config.cookieName] ?? null;
  }

  /**
   * ヘッダーからCSRFトークンを取得
   */
  private getTokenFromHeader(req: IncomingMessage): string | null {
    const headerValue = req.headers[this.config.headerName];
    if (Array.isArray(headerValue)) {
      return headerValue[0] ?? null;
    }
    return headerValue ?? null;
  }

  /**
   * タイミング攻撃を防ぐ文字列比較
   */
  private safeCompare(a: string, b: string): boolean {
    if (a.length !== b.length) {
      return false;
    }
    try {
      return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
    } catch {
      return false;
    }
  }

  /**
   * 403 Forbidden レスポンスを送信
   */
  private sendForbidden(res: ServerResponse, message: string): void {
    res.writeHead(403, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        code: 'CSRF_ERROR',
        message,
      })
    );
  }
}
