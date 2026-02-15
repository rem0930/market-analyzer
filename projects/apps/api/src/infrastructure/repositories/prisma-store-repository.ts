/**
 * @what 店舗の Prisma リポジトリ
 * @why PostgreSQL を使った本番用実装
 */

import { Result } from '@monorepo/shared';
import type { RepositoryError } from '@monorepo/shared';
import type { PrismaClient } from '../database/index.js';
import {
  Store,
  StoreId,
  StoreName,
  StoreAddress,
  CenterPoint,
  type StoreRepository,
} from '../../domain/index.js';

export class PrismaStoreRepository implements StoreRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: StoreId): Promise<Result<Store, RepositoryError>> {
    try {
      const record = await this.prisma.store.findUnique({
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

  async exists(id: StoreId): Promise<Result<boolean, RepositoryError>> {
    try {
      const count = await this.prisma.store.count({
        where: { id: id.value },
      });
      return Result.ok(count > 0);
    } catch {
      return Result.fail('db_error');
    }
  }

  async findByUserId(userId: string): Promise<Result<Store[], RepositoryError>> {
    try {
      const records = await this.prisma.store.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });

      return Result.ok(records.map((r) => this.toDomain(r)));
    } catch {
      return Result.fail('db_error');
    }
  }

  async save(aggregate: Store): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.store.create({
        data: {
          id: aggregate.id.value,
          userId: aggregate.userId,
          name: aggregate.name.value,
          address: aggregate.address.value,
          longitude: aggregate.location.longitude,
          latitude: aggregate.location.latitude,
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

  async update(aggregate: Store): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.store.update({
        where: { id: aggregate.id.value },
        data: {
          name: aggregate.name.value,
          address: aggregate.address.value,
          longitude: aggregate.location.longitude,
          latitude: aggregate.location.latitude,
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

  async delete(id: StoreId): Promise<Result<void, RepositoryError>> {
    try {
      await this.prisma.store.delete({
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
    userId: string;
    name: string;
    address: string;
    longitude: number;
    latitude: number;
    createdAt: Date;
    updatedAt: Date;
    version: number;
  }): Store {
    return Store.restore(
      new StoreId(record.id),
      record.userId,
      StoreName.create(record.name),
      StoreAddress.create(record.address),
      CenterPoint.create(record.longitude, record.latitude),
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
