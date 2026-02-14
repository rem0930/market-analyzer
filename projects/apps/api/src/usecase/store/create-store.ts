/**
 * @what 店舗作成ユースケース
 * @why アプリケーション層で店舗作成フローをオーケストレーション
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  Store,
  StoreId,
  StoreName,
  StoreAddress,
  CenterPoint,
  type StoreRepository,
} from '../../domain/index.js';

export interface CreateStoreInput {
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  requestId: string;
}

export interface CreateStoreOutput {
  id: string;
  userId: string;
  name: string;
  address: string;
  longitude: number;
  latitude: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateStoreError =
  | 'invalid_name'
  | 'invalid_address'
  | 'invalid_location'
  | 'repository_error';

export class CreateStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: CreateStoreInput): AsyncResult<CreateStoreOutput, CreateStoreError> {
    let name: StoreName;
    try {
      name = StoreName.create(input.name);
    } catch {
      return Result.fail('invalid_name');
    }

    let address: StoreAddress;
    try {
      address = StoreAddress.create(input.address);
    } catch {
      return Result.fail('invalid_address');
    }

    let location: CenterPoint;
    try {
      location = CenterPoint.create(input.longitude, input.latitude);
    } catch {
      return Result.fail('invalid_location');
    }

    const storeId = new StoreId(crypto.randomUUID());
    const createResult = Store.create({
      id: storeId,
      userId: input.userId,
      name,
      address,
      location,
      causationId: input.requestId,
      correlationId: input.requestId,
    });

    if (createResult.isFailure()) {
      return Result.fail('repository_error');
    }

    const store = createResult.value;
    const saveResult = await this.storeRepository.save(store);
    if (saveResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(toOutput(store));
  }
}

function toOutput(store: Store): CreateStoreOutput {
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
