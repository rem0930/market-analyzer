/**
 * @what インメモリ競合店舗リポジトリ（開発・テスト用）
 * @why infrastructure層でドメインのリポジトリインターフェースを実装
 */

import { Result, type RepositoryError } from '@monorepo/shared';
import { Competitor, CompetitorId, type CompetitorRepository } from '../../domain/index.js';

export class InMemoryCompetitorRepository implements CompetitorRepository {
  private readonly competitors = new Map<string, Competitor>();

  async findById(id: CompetitorId): Promise<Result<Competitor, RepositoryError>> {
    const competitor = this.competitors.get(id.value);
    if (!competitor) {
      return Result.fail('not_found');
    }
    return Result.ok(competitor);
  }

  async exists(id: CompetitorId): Promise<Result<boolean, RepositoryError>> {
    return Result.ok(this.competitors.has(id.value));
  }

  async findByStoreId(storeId: string): Promise<Result<Competitor[], RepositoryError>> {
    const results: Competitor[] = [];
    for (const competitor of this.competitors.values()) {
      if (competitor.storeId === storeId) {
        results.push(competitor);
      }
    }
    return Result.ok(results);
  }

  async save(aggregate: Competitor): Promise<Result<void, RepositoryError>> {
    if (this.competitors.has(aggregate.id.value)) {
      return Result.fail('conflict');
    }
    this.competitors.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async update(aggregate: Competitor): Promise<Result<void, RepositoryError>> {
    if (!this.competitors.has(aggregate.id.value)) {
      return Result.fail('not_found');
    }
    this.competitors.set(aggregate.id.value, aggregate);
    aggregate.clearDomainEvents();
    return Result.ok(undefined);
  }

  async delete(id: CompetitorId): Promise<Result<void, RepositoryError>> {
    if (!this.competitors.has(id.value)) {
      return Result.fail('not_found');
    }
    this.competitors.delete(id.value);
    return Result.ok(undefined);
  }

  clear(): void {
    this.competitors.clear();
  }
}
