/**
 * @what 店舗削除ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { StoreId, type StoreRepository } from '../../domain/index.js';

export interface DeleteStoreInput {
  storeId: string;
  userId: string;
}

export type DeleteStoreError = 'invalid_id' | 'not_found' | 'repository_error';

export class DeleteStoreUseCase {
  constructor(private readonly storeRepository: StoreRepository) {}

  async execute(input: DeleteStoreInput): AsyncResult<void, DeleteStoreError> {
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

    if (findResult.value.userId !== input.userId) {
      return Result.fail('not_found');
    }

    const deleteResult = await this.storeRepository.delete(storeId);
    if (deleteResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(undefined);
  }
}
