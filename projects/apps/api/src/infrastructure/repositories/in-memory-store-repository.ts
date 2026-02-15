/**
 * @what インメモリ店舗リポジトリ（開発・テスト用）
 * @why infrastructure層でドメインのリポジトリインターフェースを実装
 */

import { Result, type RepositoryError } from '@monorepo/shared';
import { Store, StoreId, type StoreRepository } from '../../domain/index.js';

export class InMemoryStoreRepository implements StoreRepository {
  private readonly stores = new Map<string, Store>();

  async findById(id: StoreId): Promise<Result<Store, RepositoryError>> {
    const store = this.stores.get(id.value);
    if (!store) {
      return Result.fail('not_found');
    }
    return Result.ok(store);
  }

  async exists(id: StoreId): Promise<Result<boolean, RepositoryError>> {
    return Result.ok(this.stores.has(id.value));
  }

  async findByUserId(userId: string): Promise<Result<Store[], RepositoryError>> {
    const results: Store[] = [];
    for (const store of this.stores.values()) {
      if (store.userId === userId) {
        results.push(store);
      }
    }
    return Result.ok(results);
  }

  async save(aggregate: Store): Promise<Result<void, RepositoryError>> {
    if (this.stores.has(aggregate.id.value)) {
      return Result.fail('conflict');
    }
    this.stores.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async update(aggregate: Store): Promise<Result<void, RepositoryError>> {
    if (!this.stores.has(aggregate.id.value)) {
      return Result.fail('not_found');
    }
    this.stores.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async delete(id: StoreId): Promise<Result<void, RepositoryError>> {
    if (!this.stores.has(id.value)) {
      return Result.fail('not_found');
    }
    this.stores.delete(id.value);
    return Result.ok(undefined);
  }

  clear(): void {
    this.stores.clear();
  }
}
