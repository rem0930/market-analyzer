/**
 * @what パスワードリセット要求ユースケース
 * @why パスワードリセットトークンの生成とメール送信
 */

import { Result, Email } from '@monorepo/shared';
import { v4 as uuidv4 } from 'uuid';
import {
  PasswordResetToken,
  PasswordResetTokenId,
  type AuthUserRepository,
  type PasswordResetTokenRepository,
  type TokenHashService,
} from '../../domain/index.js';

export interface ForgotPasswordInput {
  email: string;
}

export interface ForgotPasswordOutput {
  message: string;
  // テスト用: 実際の実装ではメール送信のみ
  _debug?: {
    token: string;
  };
}

export type ForgotPasswordError = 'internal_error';

// メール送信サービスのインターフェース
export interface EmailService {
  sendPasswordResetEmail(email: string, token: string): Promise<Result<void, 'send_failed'>>;
}

export class ForgotPasswordUseCase {
  // トークンの有効期限: 1時間
  private readonly TOKEN_EXPIRY_MS = 60 * 60 * 1000;

  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly tokenHashService: TokenHashService,
    private readonly emailService: EmailService,
    private readonly debug: boolean = false
  ) {}

  async execute(
    input: ForgotPasswordInput
  ): Promise<Result<ForgotPasswordOutput, ForgotPasswordError>> {
    const successMessage = 'If the email exists, a reset link has been sent.';

    // タイミング攻撃対策: ユーザー存在有無に関わらず同じ処理フローを実行
    // 常にトークン生成とハッシュ化を行い、レスポンス時間を均一化
    const dummyToken = this.tokenHashService.generateToken();
    this.tokenHashService.hashToken(dummyToken);

    // セキュリティ上、ユーザーが存在しなくても成功レスポンスを返す
    let email: Email;
    try {
      email = Email.create(input.email);
    } catch {
      return Result.ok({ message: successMessage });
    }

    const userResult = await this.authUserRepository.findByEmail(email);
    if (userResult.isFailure()) {
      return Result.fail('internal_error');
    }

    const user = userResult.value;
    if (!user) {
      // ユーザーが存在しなくても成功レスポンス
      // ダミーのトークン生成は既に上で実行済み（タイミング攻撃対策）
      return Result.ok({ message: successMessage });
    }

    // 既存の未使用トークンを無効化
    await this.passwordResetTokenRepository.invalidateAllByUserId(user.id);

    // 新しいトークンを生成
    const rawToken = this.tokenHashService.generateToken();
    const tokenHash = this.tokenHashService.hashToken(rawToken);

    const resetToken = PasswordResetToken.create({
      id: new PasswordResetTokenId(uuidv4()),
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + this.TOKEN_EXPIRY_MS),
    });

    if (resetToken.isFailure()) {
      return Result.fail('internal_error');
    }

    const saveResult = await this.passwordResetTokenRepository.save(resetToken.value);
    if (saveResult.isFailure()) {
      return Result.fail('internal_error');
    }

    // メール送信
    await this.emailService.sendPasswordResetEmail(user.email.value, rawToken);

    const output: ForgotPasswordOutput = {
      message: successMessage,
    };

    // デバッグモードでのみトークンを返す
    if (this.debug) {
      output._debug = { token: rawToken };
    }

    return Result.ok(output);
  }
}
