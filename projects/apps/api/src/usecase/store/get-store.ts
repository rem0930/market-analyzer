/**
 * @what 店舗取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { StoreId, type StoreRepository, type Store } from '../../domain/index.js';

export interface GetStoreInput {
  storeId: string;
  userId: string;
}

export interface GetStoreOutput {
  id: string;
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  updatedAt: string;
}

export type GetStoreError = 'invalid_id' | 'not_found' | 'repository_error';

export class GetStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: GetStoreInput): AsyncResult<GetStoreOutput, GetStoreError> {
    let storeId: StoreId;
    try {
      storeId = new StoreId(input.storeId);
    } catch {
      return Result.fail('invalid_id');
    }

    const result = await this.storeRepository.findById(storeId);
    if (result.isFailure()) {
      return Result.fail(result.error === 'not_found' ? 'not_found' : 'repository_error');
    }

    const store = result.value;
    if (store.userId !== input.userId) {
      return Result.fail('not_found');
    }

    return Result.ok(toOutput(store));
  }
}

function toOutput(store: Store): GetStoreOutput {
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
