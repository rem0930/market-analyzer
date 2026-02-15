/**
 * @what 競合店舗の Prisma リポジトリ
 * @why PostgreSQL を使った本番用実装
 */

import { Result } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PrismaClient } from '../database/index.js';
import {
  Competitor,
  CompetitorId,
  CompetitorName,
  CompetitorSource,
  CenterPoint,
  type CompetitorRepository,
} from '../../domain/index.js';

export class PrismaCompetitorRepository implements CompetitorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: CompetitorId): Promise<Result<Competitor, RepositoryError>> {
    try {
      const record = await this.prisma.competitor.findUnique({
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

  async exists(id: CompetitorId): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.competitor.count({
        where: { id: id.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async findByStoreId(storeId: string): Promise<Result<Competitor[], RepositoryError>> {
    try {
      const records = await this.prisma.competitor.findMany({
        where: { storeId },
        orderBy: { createdAt: 'desc' },
      });

      return Result.ok(records.map((r) => this.toDomain(r)));
    } catch {
      return Result.fail('db_error');
    }
  }

  async findByGooglePlaceIds(
    storeId: string,
    placeIds: string[]
  ): Promise<Result<Competitor[], RepositoryError>> {
    try {
      const records = await this.prisma.competitor.findMany({
        where: {
          storeId,
          googlePlaceId: { in: placeIds },
        },
      });

      return Result.ok(records.map((r) => this.toDomain(r)));
    } catch {
      return Result.fail('db_error');
    }
  }

  async save(aggregate: Competitor): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.competitor.create({
        data: {
          id: aggregate.id.value,
          storeId: aggregate.storeId,
          name: aggregate.name.value,
          longitude: aggregate.location.longitude,
          latitude: aggregate.location.latitude,
          source: aggregate.source.value,
          googlePlaceId: aggregate.googlePlaceId,
          category: aggregate.category,
          createdAt: aggregate.createdAt,
          updatedAt: aggregate.updatedAt,
          version: aggregate.version,
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

  async saveMany(aggregates: Competitor[]): Promise<Result<number, RepositoryError>> {
    if (aggregates.length === 0) return Result.ok(0);

    try {
      const result = await this.prisma.competitor.createMany({
        data: aggregates.map((a) => ({
          id: a.id.value,
          storeId: a.storeId,
          name: a.name.value,
          longitude: a.location.longitude,
          latitude: a.location.latitude,
          source: a.source.value,
          googlePlaceId: a.googlePlaceId,
          category: a.category,
          createdAt: a.createdAt,
          updatedAt: a.updatedAt,
          version: a.version,
        })),
        skipDuplicates: true,
      });

      for (const aggregate of aggregates) {
        aggregate.clearDomainEvents();
      }

      return Result.ok(result.count);
    } catch {
      return Result.fail('db_error');
    }
  }

  async update(aggregate: Competitor): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.competitor.update({
        where: { id: aggregate.id.value },
        data: {
          name: aggregate.name.value,
          longitude: aggregate.location.longitude,
          latitude: aggregate.location.latitude,
          category: aggregate.category,
          updatedAt: aggregate.updatedAt,
          version: aggregate.version,
        },
      });
      aggregate.clearDomainEvents();
      return Result.ok(undefined);
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        return Result.fail('not_found');
      }
      return Result.fail('db_error');
    }
  }

  async delete(id: CompetitorId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.competitor.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch (error) {
      if (this.isRecordNotFoundError(error)) {
        return Result.fail('not_found');
      }
      return Result.fail('db_error');
    }
  }

  private toDomain(record: {
    id: string;
    storeId: string;
    name: string;
    longitude: number;
    latitude: number;
    source: string;
    googlePlaceId: string | null;
    category: string | null;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }): Competitor {
    return Competitor.restore(
      new CompetitorId(record.id),
      record.storeId,
      CompetitorName.create(record.name),
      CenterPoint.create(record.longitude, record.latitude),
      CompetitorSource.create(record.source),
      record.googlePlaceId,
      record.category,
      record.createdAt,
      record.updatedAt,
      record.version
    );
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }

  private isRecordNotFoundError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2025';
  }
}
