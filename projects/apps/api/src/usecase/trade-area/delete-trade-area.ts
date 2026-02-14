/**
 * @what 商圏削除ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { TradeAreaId, type TradeAreaRepository } from '../../domain/index.js';

export interface DeleteTradeAreaInput {
  tradeAreaId: string;
  userId: string;
}

export type DeleteTradeAreaError = 'invalid_id' | 'not_found' | 'repository_error';

export class DeleteTradeAreaUseCase {
  constructor(private readonly tradeAreaRepository: TradeAreaRepository) {}

  async execute(input: DeleteTradeAreaInput): AsyncResult<void, DeleteTradeAreaError> {
    let tradeAreaId: TradeAreaId;
    try {
      tradeAreaId = new TradeAreaId(input.tradeAreaId);
    } catch {
      return Result.fail('invalid_id');
    }

    const findResult = await this.tradeAreaRepository.findById(tradeAreaId);
    if (findResult.isFailure()) {
      return Result.fail(findResult.error === 'not_found' ? 'not_found' : 'repository_error');
    }

    if (findResult.value.userId !== input.userId) {
      return Result.fail('not_found');
    }

    const deleteResult = await this.tradeAreaRepository.delete(tradeAreaId);
    if (deleteResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(undefined);
  }
}
