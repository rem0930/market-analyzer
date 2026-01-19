/**
 * @what パスワードリセットトークンの Prisma リポジトリ
 * @why PostgreSQL を使った本番用実装
 */

import { Result } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PrismaClient } from '../database/index.js';
import type { PasswordResetTokenRepository } from '../../domain/auth/password-reset-token-repository.js';
import {
  PasswordResetToken,
  PasswordResetTokenId,
} from '../../domain/auth/password-reset-token.js';
import { TokenHash } from '../../domain/auth/refresh-token.js';
import { AuthUserId } from '../../domain/auth/auth-user.js';

export class PrismaPasswordResetTokenRepository implements PasswordResetTokenRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(token: PasswordResetToken): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.passwordResetToken.create({
        data: {
          id: token.id.value,
          userId: token.userId.value,
          tokenHash: token.tokenHash.value,
          expiresAt: token.expiresAt,
          createdAt: token.createdAt,
          usedAt: token.usedAt,
        },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('db_error');
    }
  }

  async update(token: PasswordResetToken): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.passwordResetToken.update({
        where: { id: token.id.value },
        data: {
          usedAt: token.usedAt,
        },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('db_error');
    }
  }

  async findById(
    id: PasswordResetTokenId
  ): Promise<Result<PasswordResetToken | null, RepositoryError>> {
    try {
      const record = await this.prisma.passwordResetToken.findUnique({
        where: { id: id.value },
      });

      if (!record) {
        return Result.ok(null);
      }

      return Result.ok(this.toDomain(record));
    } catch {
      return Result.fail('db_error');
    }
  }

  async findByTokenHash(
    tokenHash: TokenHash
  ): Promise<Result<PasswordResetToken | null, RepositoryError>> {
    try {
      const record = await this.prisma.passwordResetToken.findFirst({
        where: { tokenHash: tokenHash.value },
      });

      if (!record) {
        return Result.ok(null);
      }

      return Result.ok(this.toDomain(record));
    } catch {
      return Result.fail('db_error');
    }
  }

  async invalidateAllByUserId(userId: AuthUserId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.passwordResetToken.updateMany({
        where: {
          userId: userId.value,
          usedAt: null,
          expiresAt: { gt: new Date() },
        },
        data: {
          usedAt: new Date(),
        },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('db_error');
    }
  }

  async delete(id: PasswordResetTokenId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.passwordResetToken.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('db_error');
    }
  }

  private toDomain(record: {
    id: string;
    userId: string;
    tokenHash: string;
    expiresAt: Date;
    createdAt: Date;
    usedAt: Date | null;
  }): PasswordResetToken {
    return PasswordResetToken.restore(
      new PasswordResetTokenId(record.id),
      new AuthUserId(record.userId),
      TokenHash.create(record.tokenHash),
      record.expiresAt,
      record.createdAt,
      record.usedAt
    );
  }
}
