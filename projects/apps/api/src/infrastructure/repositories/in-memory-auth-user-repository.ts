/**
 * @what 認証ユーザーのインメモリリポジトリ
 * @why 開発・テスト用の簡易実装
 */

import { Result, Email } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { AuthUserRepository } from '../../domain/auth/auth-user-repository.js';
import { AuthUser, AuthUserId } from '../../domain/auth/auth-user.js';

export class InMemoryAuthUserRepository implements AuthUserRepository {
  private users: Map<string, AuthUser> = new Map();

  async save(user: AuthUser): Promise<Result<void, RepositoryError>> {
    // メールアドレスの重複チェック
    for (const existingUser of this.users.values()) {
      if (existingUser.email.equals(user.email) && !existingUser.id.equals(user.id)) {
        return Result.fail('conflict');
      }
    }

    this.users.set(user.id.value, user);
    user.clearDomainEvents();
    return Result.ok(undefined);
  }

  async findById(id: AuthUserId): Promise<Result<AuthUser, RepositoryError>> {
    const user = this.users.get(id.value);
    if (!user) {
      return Result.fail('not_found');
    }
    return Result.ok(user);
  }

  async exists(id: AuthUserId): Promise<Result<boolean, RepositoryError>> {
    return Result.ok(this.users.has(id.value));
  }

  async update(user: AuthUser): Promise<Result<void, RepositoryError>> {
    if (!this.users.has(user.id.value)) {
      return Result.fail('not_found');
    }
    this.users.set(user.id.value, user);
    user.clearDomainEvents();
    return Result.ok(undefined);
  }

  async findByEmail(email: Email): Promise<Result<AuthUser | null, RepositoryError>> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return Result.ok(user);
      }
    }
    return Result.ok(null);
  }

  async emailExists(email: Email): Promise<Result<boolean, RepositoryError>> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return Result.ok(true);
      }
    }
    return Result.ok(false);
  }

  async delete(id: AuthUserId): Promise<Result<void, RepositoryError>> {
    if (!this.users.has(id.value)) {
      return Result.fail('not_found');
    }
    this.users.delete(id.value);
    return Result.ok(undefined);
  }

  // テスト用のヘルパーメソッド
  clear(): void {
    this.users.clear();
  }
}
