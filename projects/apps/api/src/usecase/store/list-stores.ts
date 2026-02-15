/**
 * @what 店舗一覧取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { type StoreRepository, type Store } from '../../domain/index.js';

export interface ListStoresInput {
  userId: string;
}

export interface ListStoresOutput {
  stores: StoreItem[];
  total: number;
}

export interface StoreItem {
  id: string;
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  updatedAt: string;
}

export type ListStoresError = 'repository_error';

export class ListStoresUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: ListStoresInput): AsyncResult<ListStoresOutput, ListStoresError> {
    const result = await this.storeRepository.findByUserId(input.userId);
    if (result.isFailure()) {
      return Result.fail('repository_error');
    }

    const items = result.value.map(toItem);
    return Result.ok({ stores: items, total: items.length });
  }
}

function toItem(store: Store): StoreItem {
  return {
    id: store.id.value,
    userId: store.userId,
    name: store.name.value,
    address: store.address.value,
    longitude: store.location.longitude,
    latitude: store.location.latitude,
    createdAt: store.createdAt.toISOString(),
    updatedAt: store.updatedAt.toISOString(),
  };
}
