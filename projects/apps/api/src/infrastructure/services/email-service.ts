/**
 * @what メール送信サービスの実装
 * @why 開発環境用のダミー実装（本番はSES等を使う）
 */

import { Result } from '@monorepo/shared';
import type { EmailService } from '../../usecase/auth/forgot-password.js';
import { logger } from '../logger/index.js';

/**
 * 開発用のロガーベースメールサービス
 * 実際にはメールを送信せず、ログに出力する
 */
export class LoggerEmailService implements EmailService {
  async sendPasswordResetEmail(email: string, token: string): Promise<Result<void, 'send_failed'>> {
    // Security: Never log full tokens, even in development
    const maskedToken = `${token.slice(0, 4)}...${token.slice(-4)}`;
    logger.info('Password reset email would be sent', {
      email,
      tokenPreview: maskedToken,
      tokenLength: token.length,
      note: 'Development mode - no actual email sent',
    });
    return Result.ok(undefined);
  }
}
