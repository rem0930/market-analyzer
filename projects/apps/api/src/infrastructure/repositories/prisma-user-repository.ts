/**
 * @what ユーザーの Prisma リポジトリ
 * @why PostgreSQL を使った本番用実装
 */

import { Result, Email } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PrismaClient } from '../database/index.js';
import { User, UserId, type UserRepository, type UserRepositoryError } from '../../domain/index.js';

export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: UserId): Promise<Result<User, RepositoryError>> {
    try {
      const record = await this.prisma.user.findUnique({
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

  async exists(id: UserId): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.user.count({
        where: { id: id.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async findByEmail(email: Email): Promise<Result<User, UserRepositoryError>> {
    try {
      const record = await this.prisma.user.findUnique({
        where: { email: email.value },
      });

      if (!record) {
        return Result.fail('not_found');
      }

      return Result.ok(this.toDomain(record));
    } catch {
      return Result.fail('db_error');
    }
  }

  async emailExists(email: Email): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.user.count({
        where: { email: email.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async save(aggregate: User): Promise<Result<void, RepositoryError>> {
    try {
      const now = new Date();
      await this.prisma.user.create({
        data: {
          id: aggregate.id.value,
          name: aggregate.name,
          email: aggregate.email.value,
          createdAt: now,
          updatedAt: now,
        },
      });
      aggregate.clearDomainEvents();
      return Result.ok(undefined);
    } catch (error) {
      if (this.isUniqueConstraintError(error)) {
        return Result.fail('conflict');
      }
      return Result.fail('db_error');
    }
  }

  async update(aggregate: User): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.user.update({
        where: { id: aggregate.id.value },
        data: {
          name: aggregate.name,
          email: aggregate.email.value,
          updatedAt: new Date(),
        },
      });
      aggregate.clearDomainEvents();
      return Result.ok(undefined);
    } catch {
      return Result.fail('not_found');
    }
  }

  async delete(id: UserId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.user.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('not_found');
    }
  }

  private toDomain(record: { id: string; name: string; email: string }): User {
    // Email.create() throws on invalid email, so we trust the database has valid emails
    const email = Email.create(record.email);

    return User.restore(new UserId(record.id), email, record.name, 1);
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
