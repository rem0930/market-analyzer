/**
 * @what レート制限ミドルウェア
 * @why ブルートフォース攻撃や DoS 攻撃を防止するため、リクエスト数を制限
 */

import type { IncomingMessage, ServerResponse } from 'node:http';

export interface RateLimitConfig {
  /** ウィンドウサイズ（ミリ秒） */
  windowMs: number;
  /** ウィンドウ内の最大リクエスト数 */
  maxRequests: number;
  /** 制限超過時のメッセージ */
  message: string;
}

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

const DEFAULT_CONFIG: RateLimitConfig = {
  windowMs: 60 * 1000,
  maxRequests: 5,
  message: 'Too many requests, please try again later',
};

export class RateLimitMiddleware {
  private readonly config: RateLimitConfig;
  private readonly store: Map<string, RateLimitEntry> = new Map();
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(config: Partial<RateLimitConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.startCleanup();
  }

  /**
   * レート制限をチェック
   * @returns true: 制限超過でリクエストを拒否、false: リクエスト処理を続行
   */
  check(req: IncomingMessage, res: ServerResponse): boolean {
    const clientIp = this.getClientIp(req);
    const now = Date.now();

    let entry = this.store.get(clientIp);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + this.config.windowMs,
      };
      this.store.set(clientIp, entry);
    } else {
      entry.count++;
    }

    const remaining = Math.max(0, this.config.maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    res.setHeader('X-RateLimit-Limit', String(this.config.maxRequests));
    res.setHeader('X-RateLimit-Remaining', String(remaining));
    res.setHeader('X-RateLimit-Reset', String(resetSeconds));

    if (entry.count > this.config.maxRequests) {
      res.setHeader('Retry-After', String(resetSeconds));
      res.writeHead(429, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({
          code: 'RATE_LIMIT_EXCEEDED',
          message: this.config.message,
          retryAfter: resetSeconds,
        })
      );
      return true;
    }

    return false;
  }

  private getClientIp(req: IncomingMessage): string {
    const forwarded = req.headers['x-forwarded-for'];
    if (forwarded) {
      const ips = Array.isArray(forwarded) ? forwarded[0] : forwarded;
      return ips.split(',')[0].trim();
    }

    return req.socket.remoteAddress ?? 'unknown';
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(
      () => {
        const now = Date.now();
        for (const [key, entry] of this.store.entries()) {
          if (now > entry.resetTime) {
            this.store.delete(key);
          }
        }
      },
      5 * 60 * 1000
    );

    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.store.clear();
  }
}
