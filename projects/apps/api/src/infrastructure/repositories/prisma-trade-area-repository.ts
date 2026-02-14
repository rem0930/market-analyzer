/**
 * @what 商圏の Prisma リポジトリ
 * @why PostgreSQL を使った本番用実装
 */

import { Result } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PrismaClient } from '../database/index.js';
import {
  TradeArea,
  TradeAreaId,
  TradeAreaName,
  CenterPoint,
  Radius,
  type TradeAreaRepository,
} from '../../domain/index.js';

export class PrismaTradeAreaRepository implements TradeAreaRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: TradeAreaId): Promise<Result<TradeArea, RepositoryError>> {
    try {
      const record = await this.prisma.tradeArea.findUnique({
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

  async exists(id: TradeAreaId): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.tradeArea.count({
        where: { id: id.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async findByUserId(userId: string): Promise<Result<TradeArea[], RepositoryError>> {
    try {
      const records = await this.prisma.tradeArea.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return Result.ok(records.map((r) => this.toDomain(r)));
    } catch {
      return Result.fail('db_error');
    }
  }

  async save(aggregate: TradeArea): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.tradeArea.create({
        data: {
          id: aggregate.id.value,
          userId: aggregate.userId,
          name: aggregate.name.value,
          longitude: aggregate.center.longitude,
          latitude: aggregate.center.latitude,
          radiusKm: aggregate.radius.value,
          createdAt: aggregate.createdAt,
          updatedAt: aggregate.updatedAt,
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

  async update(aggregate: TradeArea): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.tradeArea.update({
        where: { id: aggregate.id.value },
        data: {
          name: aggregate.name.value,
          longitude: aggregate.center.longitude,
          latitude: aggregate.center.latitude,
          radiusKm: aggregate.radius.value,
          updatedAt: new Date(),
        },
      });
      aggregate.clearDomainEvents();
      return Result.ok(undefined);
    } catch {
      return Result.fail('not_found');
    }
  }

  async delete(id: TradeAreaId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.tradeArea.delete({
        where: { id: id.value },
      });
      return Result.ok(undefined);
    } catch {
      return Result.fail('not_found');
    }
  }

  private toDomain(record: {
    id: string;
    userId: string;
    name: string;
    longitude: number;
    latitude: number;
    radiusKm: number;
    createdAt: Date;
    updatedAt: Date;
  }): TradeArea {
    return TradeArea.restore(
      new TradeAreaId(record.id),
      record.userId,
      TradeAreaName.create(record.name),
      CenterPoint.create(record.longitude, record.latitude),
      Radius.create(record.radiusKm),
      record.createdAt,
      record.updatedAt,
      1
    );
  }

  private isUniqueConstraintError(error: unknown): boolean {
    return typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002';
  }
}
