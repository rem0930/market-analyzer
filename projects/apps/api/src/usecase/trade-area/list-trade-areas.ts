/**
 * @what 商圏一覧取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import { type TradeAreaRepository, type TradeArea } from '../../domain/index.js';

export interface ListTradeAreasInput {
  userId: string;
}

export interface ListTradeAreasOutput {
  tradeAreas: TradeAreaItem[];
  total: number;
}

export interface TradeAreaItem {
  id: string;
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export type ListTradeAreasError = 'repository_error';

export class ListTradeAreasUseCase {
  constructor(private readonly tradeAreaRepository: TradeAreaRepository) {}

  async execute(
    input: ListTradeAreasInput
  ): AsyncResult<ListTradeAreasOutput, ListTradeAreasError> {
    const result = await this.tradeAreaRepository.findByUserId(input.userId);
    if (result.isFailure()) {
      return Result.fail('repository_error');
    }

    const items = result.value.map(toItem);
    return Result.ok({ tradeAreas: items, total: items.length });
  }
}

function toItem(ta: TradeArea): TradeAreaItem {
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
