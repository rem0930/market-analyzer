/**
 * @what インメモリユーザーリポジトリ（開発・テスト用）
 * @why infrastructure層でドメインのリポジトリインターフェースを実装
 *
 * infrastructure層のルール:
 * - domain層のインターフェースを実装
 * - usecase層、presentation層をimportしない
 * - 外部サービス・DB等への具体的な接続を担当
 */

import { Result, Email, type RepositoryError } from '@monorepo/shared';
import {
  User,
  UserId,
  type UserRepository,
  type UserRepositoryError,
} from '../../domain/index.js';

/**
 * インメモリユーザーリポジトリ
 * 開発・テスト用の簡易実装
 */
export class InMemoryUserRepository implements UserRepository {
  private readonly users = new Map<string, User>();

  async findById(id: UserId): Promise<Result<User, RepositoryError>> {
    const user = this.users.get(id.value);
    if (!user) {
      return Result.fail('not_found');
    }
    return Result.ok(user);
  }

  async exists(id: UserId): Promise<Result<boolean, RepositoryError>> {
    return Result.ok(this.users.has(id.value));
  }

  async findByEmail(email: Email): Promise<Result<User, UserRepositoryError>> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return Result.ok(user);
      }
    }
    return Result.fail('not_found');
  }

  async emailExists(email: Email): Promise<Result<boolean, RepositoryError>> {
    for (const user of this.users.values()) {
      if (user.email.equals(email)) {
        return Result.ok(true);
      }
    }
    return Result.ok(false);
  }

  async save(aggregate: User): Promise<Result<void, RepositoryError>> {
    if (this.users.has(aggregate.id.value)) {
      return Result.fail('conflict');
    }
    this.users.set(aggregate.id.value, aggregate);
    // ドメインイベントをクリア（実際にはイベントディスパッチャーに送る）
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async update(aggregate: User): Promise<Result<void, RepositoryError>> {
    if (!this.users.has(aggregate.id.value)) {
      return Result.fail('not_found');
    }
    this.users.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async delete(id: UserId): Promise<Result<void, RepositoryError>> {
    if (!this.users.has(id.value)) {
      return Result.fail('not_found');
    }
    this.users.delete(id.value);
    return Result.ok(undefined);
  }

  /**
   * テスト用: リポジトリをクリア
   */
  clear(): void {
    this.users.clear();
  }
}
