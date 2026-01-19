/**
 * @what パスワードリセット実行ユースケース
 * @why トークンを使用したパスワードリセット
 */

import { Result } from '@monorepo/shared';
import type {
  AuthUserRepository,
  PasswordResetTokenRepository,
  RefreshTokenRepository,
  PasswordService,
  TokenHashService,
} from '../../domain/index.js';

export interface ResetPasswordInput {
  token: string;
  password: string;
  causationId: string;
  correlationId: string;
}

export interface ResetPasswordOutput {
  message: string;
}

export type ResetPasswordError =
  | 'invalid_token'
  | 'token_expired'
  | 'weak_password'
  | 'internal_error';

export class ResetPasswordUseCase {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly passwordResetTokenRepository: PasswordResetTokenRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly passwordService: PasswordService,
    private readonly tokenHashService: TokenHashService
  ) {}

  async execute(
    input: ResetPasswordInput
  ): Promise<Result<ResetPasswordOutput, ResetPasswordError>> {
    // 1. パスワード強度の検証
    const strengthResult = this.passwordService.validateStrength(input.password);
    if (strengthResult.isFailure()) {
      return Result.fail('weak_password');
    }

    // 2. トークンの検証
    const tokenHash = this.tokenHashService.hashToken(input.token);
    const tokenResult = await this.passwordResetTokenRepository.findByTokenHash(tokenHash);
    if (tokenResult.isFailure()) {
      return Result.fail('internal_error');
    }

    const resetToken = tokenResult.value;
    if (!resetToken) {
      return Result.fail('invalid_token');
    }

    if (!resetToken.isValid()) {
      return Result.fail('token_expired');
    }

    // 3. ユーザーの取得
    const userResult = await this.authUserRepository.findById(resetToken.userId);
    if (userResult.isFailure()) {
      return Result.fail('internal_error');
    }

    const user = userResult.value;
    if (!user) {
      return Result.fail('invalid_token');
    }

    // 4. パスワードのハッシュ化
    const hashResult = await this.passwordService.hash(input.password);
    if (hashResult.isFailure()) {
      return Result.fail('internal_error');
    }

    // 5. パスワードの更新
    user.changePassword(hashResult.value, input.causationId, input.correlationId);

    const saveResult = await this.authUserRepository.save(user);
    if (saveResult.isFailure()) {
      return Result.fail('internal_error');
    }

    // 6. トークンを使用済みにする
    const markResult = resetToken.markAsUsed();
    if (markResult.isFailure()) {
      // すでに使用済みまたは期限切れ
      return Result.fail('invalid_token');
    }
    await this.passwordResetTokenRepository.save(resetToken);

    // 7. 既存のリフレッシュトークンをすべて無効化
    await this.refreshTokenRepository.revokeAllByUserId(user.id);

    return Result.ok({
      message: 'Password has been reset successfully.',
    });
  }
}
