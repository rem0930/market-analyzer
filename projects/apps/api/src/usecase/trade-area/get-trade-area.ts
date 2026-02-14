/**
 * @what 商圏取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { TradeAreaId, type TradeAreaRepository, type TradeArea } from '../../domain/index.js';

export interface GetTradeAreaInput {
  tradeAreaId: string;
  userId: string;
}

export interface GetTradeAreaOutput {
  id: string;
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export type GetTradeAreaError = 'invalid_id' | 'not_found' | 'repository_error';

export class GetTradeAreaUseCase {
  constructor(private readonly tradeAreaRepository: TradeAreaRepository) {}

  async execute(input: GetTradeAreaInput): AsyncResult<GetTradeAreaOutput, GetTradeAreaError> {
    let tradeAreaId: TradeAreaId;
    try {
      tradeAreaId = new TradeAreaId(input.tradeAreaId);
    } catch {
      return Result.fail('invalid_id');
    }

    const result = await this.tradeAreaRepository.findById(tradeAreaId);
    if (result.isFailure()) {
      return Result.fail(result.error === 'not_found' ? 'not_found' : 'repository_error');
    }

    const ta = result.value;
    if (ta.userId !== input.userId) {
      return Result.fail('not_found');
    }

    return Result.ok(toOutput(ta));
  }
}

function toOutput(ta: TradeArea): GetTradeAreaOutput {
  return {
    id: ta.id.value,
    userId: ta.userId,
    name: ta.name.value,
    longitude: ta.center.longitude,
    latitude: ta.center.latitude,
    radiusKm: ta.radius.value,
    createdAt: ta.createdAt.toISOString(),
    updatedAt: ta.updatedAt.toISOString(),
  };
}
