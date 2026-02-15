/**
 * @what 商圏更新ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  TradeAreaId,
  TradeAreaName,
  CenterPoint,
  Radius,
  type TradeAreaRepository,
  type TradeArea,
} from '../../domain/index.js';

export interface UpdateTradeAreaInput {
  tradeAreaId: string;
  userId: string;
  name?: string;
  longitude?: number;
  latitude?: number;
  radiusKm?: number;
}

export interface UpdateTradeAreaOutput {
  id: string;
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export type UpdateTradeAreaError =
  | 'invalid_id'
  | 'invalid_name'
  | 'invalid_center'
  | 'invalid_radius'
  | 'not_found'
  | 'repository_error';

export class UpdateTradeAreaUseCase {
  constructor(private readonly tradeAreaRepository: TradeAreaRepository) {}

  async execute(
    input: UpdateTradeAreaInput
  ): AsyncResult<UpdateTradeAreaOutput, UpdateTradeAreaError> {
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

    const ta = findResult.value;
    if (ta.userId !== input.userId) {
      return Result.fail('not_found');
    }

    if (input.name !== undefined) {
      let newName: TradeAreaName;
      try {
        newName = TradeAreaName.create(input.name);
      } catch {
        return Result.fail('invalid_name');
      }
      ta.rename(newName);
    }

    const hasLon = input.longitude !== undefined;
    const hasLat = input.latitude !== undefined;
    if (hasLon !== hasLat) {
      return Result.fail('invalid_center');
    }
    if (hasLon && hasLat) {
      let newCenter: CenterPoint;
      try {
        newCenter = CenterPoint.create(input.longitude!, input.latitude!);
      } catch {
        return Result.fail('invalid_center');
      }
      ta.updateCenter(newCenter);
    }

    if (input.radiusKm !== undefined) {
      let newRadius: Radius;
      try {
        newRadius = Radius.create(input.radiusKm);
      } catch {
        return Result.fail('invalid_radius');
      }
      ta.updateRadius(newRadius);
    }

    const updateResult = await this.tradeAreaRepository.update(ta);
    if (updateResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(toOutput(ta));
  }
}

function toOutput(ta: TradeArea): UpdateTradeAreaOutput {
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
