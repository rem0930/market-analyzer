/**
 * @what 店舗更新ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  StoreId,
  StoreName,
  StoreAddress,
  CenterPoint,
  type StoreRepository,
  type Store,
} from '../../domain/index.js';

export interface UpdateStoreInput {
  storeId: string;
  userId: string;
  name?: string;
  address?: string;
  longitude?: number;
  latitude?: number;
}

export interface UpdateStoreOutput {
  id: string;
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  updatedAt: string;
}

export type UpdateStoreError =
  | 'invalid_id'
  | 'invalid_name'
  | 'invalid_address'
  | 'invalid_location'
  | 'not_found'
  | 'repository_error';

export class UpdateStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: UpdateStoreInput): AsyncResult<UpdateStoreOutput, UpdateStoreError> {
    let storeId: StoreId;
    try {
      storeId = new StoreId(input.storeId);
    } catch {
      return Result.fail('invalid_id');
    }

    const findResult = await this.storeRepository.findById(storeId);
    if (findResult.isFailure()) {
      return Result.fail(findResult.error === 'not_found' ? 'not_found' : 'repository_error');
    }

    const store = findResult.value;
    if (store.userId !== input.userId) {
      return Result.fail('not_found');
    }

    if (input.name !== undefined) {
      let newName: StoreName;
      try {
        newName = StoreName.create(input.name);
      } catch {
        return Result.fail('invalid_name');
      }
      store.rename(newName);
    }

    if (input.address !== undefined) {
      let newAddress: StoreAddress;
      try {
        newAddress = StoreAddress.create(input.address);
      } catch {
        return Result.fail('invalid_address');
      }
      store.updateAddress(newAddress);
    }

    if (input.longitude !== undefined && input.latitude !== undefined) {
      let newLocation: CenterPoint;
      try {
        newLocation = CenterPoint.create(input.longitude, input.latitude);
      } catch {
        return Result.fail('invalid_location');
      }
      store.updateLocation(newLocation);
    }

    const updateResult = await this.storeRepository.update(store);
    if (updateResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(toOutput(store));
  }
}

function toOutput(store: Store): UpdateStoreOutput {
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
