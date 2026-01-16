/**
 * @what 認証ユーザーの Prisma リポジトリ
 * @why PostgreSQL を使った本番用実装
 */

import { Result, Email } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PrismaClient } from '@prisma/client';
import type { AuthUserRepository } from '../../domain/auth/auth-user-repository.js';
import { AuthUser, AuthUserId, PasswordHash } from '../../domain/auth/auth-user.js';

export class PrismaAuthUserRepository implements AuthUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async save(user: AuthUser): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.authUser.create({
        data: {
          id: user.id.value,
          email: user.email.value,
          passwordHash: user.passwordHash.value,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });
      user.clearDomainEvents();
      return Result.ok(undefined);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return Result.fail('conflict');
      }
      return Result.fail('db_error');
    }
  }

  async findById(id: AuthUserId): Promise<Result<AuthUser, RepositoryError>> {
    try {
      const record = await this.prisma.authUser.findUnique({
        where: { id: id.value },
      });

      if (!record) {
        return Result.fail('not_found');
      }

      return Result.ok(this.toDomain(record));
    } catch {
      return Result.fail('db_error');
    }
  }

  async exists(id: AuthUserId): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.authUser.count({
        where: { id: id.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async update(user: AuthUser): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.authUser.update({
        where: { id: user.id.value },
        data: {
          email: user.email.value,
          passwordHash: user.passwordHash.value,
          updatedAt: user.updatedAt,
        },
      });
      user.clearDomainEvents();
      return Result.ok(undefined);
    } catch {
      return Result.fail('not_found');
    }
  }

  async findByEmail(email: Email): Promise<Result<AuthUser | null, RepositoryError>> {
    try {
      const record = await this.prisma.authUser.findUnique({
        where: { email: email.value },
      });

      if (!record) {
        return Result.ok(null);
      }

      return Result.ok(this.toDomain(record));
    } catch {
      return Result.fail('db_error');
    }
  }

  async emailExists(email: Email): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.authUser.count({
        where: { email: email.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async delete(id: AuthUserId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.authUser.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('not_found');
    }
  }

  private toDomain(record: {
    id: string;
    email: string;
    passwordHash: string;
    createdAt: Date;
    updatedAt: Date;
  }): AuthUser {
    // Email.create() throws on invalid email, so we trust the database has valid emails
    const email = Email.create(record.email);

    return AuthUser.restore(
      new AuthUserId(record.id),
      email,
      PasswordHash.create(record.passwordHash),
      record.createdAt,
      record.updatedAt,
      1
    );
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'P2002'
    );
  }
}
