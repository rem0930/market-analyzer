/**
 * @what パスワードリセットトークンのインメモリリポジトリ
 * @why 開発・テスト用の簡易実装
 */

import { Result } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PasswordResetTokenRepository } from '../../domain/auth/password-reset-token-repository.js';
import {
  PasswordResetToken,
  PasswordResetTokenId,
} from '../../domain/auth/password-reset-token.js';
import { TokenHash } from '../../domain/auth/refresh-token.js';
import type { AuthUserId } from '../../domain/auth/auth-user.js';

export class InMemoryPasswordResetTokenRepository implements PasswordResetTokenRepository {
  private tokens: Map<string, PasswordResetToken> = new Map();

  async save(token: PasswordResetToken): Promise<Result<void, RepositoryError>> {
    this.tokens.set(token.id.value, token);
    return Result.ok(undefined);
  }

  async update(token: PasswordResetToken): Promise<Result<void, RepositoryError>> {
    if (!this.tokens.has(token.id.value)) {
      return Result.fail('not_found');
    }
    this.tokens.set(token.id.value, token);
    return Result.ok(undefined);
  }

  async findById(
    id: PasswordResetTokenId
  ): Promise<Result<PasswordResetToken | null, RepositoryError>> {
    const token = this.tokens.get(id.value);
    return Result.ok(token ?? null);
  }

  async findByTokenHash(
    tokenHash: TokenHash
  ): Promise<Result<PasswordResetToken | null, RepositoryError>> {
    for (const token of this.tokens.values()) {
      if (token.tokenHash.equals(tokenHash)) {
        return Result.ok(token);
      }
    }
    return Result.ok(null);
  }

  async invalidateAllByUserId(userId: AuthUserId): Promise<Result<void, RepositoryError>> {
    for (const [id, token] of this.tokens.entries()) {
      if (token.userId.equals(userId) && token.isValid()) {
        // 有効期限を過去に設定することで無効化
        // 実際のDBでは usedAt を設定するか削除
        this.tokens.delete(id);
      }
    }
    return Result.ok(undefined);
  }

  async delete(id: PasswordResetTokenId): Promise<Result<void, RepositoryError>> {
    this.tokens.delete(id.value);
    return Result.ok(undefined);
  }

  // テスト用のヘルパーメソッド
  clear(): void {
    this.tokens.clear();
  }
}
