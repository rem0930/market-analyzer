/**
 * @what インメモリ商圏リポジトリ（開発・テスト用）
 * @why infrastructure層でドメインのリポジトリインターフェースを実装
 */

import { Result, type RepositoryError } from '@monorepo/shared';
import { TradeArea, TradeAreaId, type TradeAreaRepository } from '../../domain/index.js';

export class InMemoryTradeAreaRepository implements TradeAreaRepository {
  private readonly tradeAreas = new Map<string, TradeArea>();

  async findById(id: TradeAreaId): Promise<Result<TradeArea, RepositoryError>> {
    const ta = this.tradeAreas.get(id.value);
    if (!ta) {
      return Result.fail('not_found');
    }
    return Result.ok(ta);
  }

  async exists(id: TradeAreaId): Promise<Result<boolean, RepositoryError>> {
    return Result.ok(this.tradeAreas.has(id.value));
  }

  async findByUserId(userId: string): Promise<Result<TradeArea[], RepositoryError>> {
    const results: TradeArea[] = [];
    for (const ta of this.tradeAreas.values()) {
      if (ta.userId === userId) {
        results.push(ta);
      }
    }
    return Result.ok(results);
  }

  async save(aggregate: TradeArea): Promise<Result<void, RepositoryError>> {
    if (this.tradeAreas.has(aggregate.id.value)) {
      return Result.fail('conflict');
    }
    this.tradeAreas.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async update(aggregate: TradeArea): Promise<Result<void, RepositoryError>> {
    if (!this.tradeAreas.has(aggregate.id.value)) {
      return Result.fail('not_found');
    }
    this.tradeAreas.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async delete(id: TradeAreaId): Promise<Result<void, RepositoryError>> {
    if (!this.tradeAreas.has(id.value)) {
      return Result.fail('not_found');
    }
    this.tradeAreas.delete(id.value);
    return Result.ok(undefined);
  }

  clear(): void {
    this.tradeAreas.clear();
  }
}
