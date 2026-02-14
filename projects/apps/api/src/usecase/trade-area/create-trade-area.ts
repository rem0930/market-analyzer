/**
 * @what 商圏作成ユースケース
 * @why アプリケーション層で商圏作成フローをオーケストレーション
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  TradeArea,
  TradeAreaId,
  TradeAreaName,
  CenterPoint,
  Radius,
  type TradeAreaRepository,
} from '../../domain/index.js';

export interface CreateTradeAreaInput {
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  requestId: string;
}

export interface CreateTradeAreaOutput {
  id: string;
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  radiusKm: number;
  createdAt: string;
  updatedAt: string;
}

export type CreateTradeAreaError =
  | 'invalid_name'
  | 'invalid_center'
  | 'invalid_radius'
  | 'repository_error';

export class CreateTradeAreaUseCase {
  constructor(private readonly tradeAreaRepository: TradeAreaRepository) {}

  async execute(
    input: CreateTradeAreaInput
  ): AsyncResult<CreateTradeAreaOutput, CreateTradeAreaError> {
    let name: TradeAreaName;
    try {
      name = TradeAreaName.create(input.name);
    } catch {
      return Result.fail('invalid_name');
    }

    let center: CenterPoint;
    try {
      center = CenterPoint.create(input.longitude, input.latitude);
    } catch {
      return Result.fail('invalid_center');
    }

    let radius: Radius;
    try {
      radius = Radius.create(input.radiusKm);
    } catch {
      return Result.fail('invalid_radius');
    }

    const tradeAreaId = new TradeAreaId(crypto.randomUUID());
    const createResult = TradeArea.create({
      id: tradeAreaId,
      userId: input.userId,
      name,
      center,
      radius,
      causationId: input.requestId,
      correlationId: input.requestId,
    });

    if (createResult.isFailure()) {
      return Result.fail('repository_error');
    }

    const ta = createResult.value;
    const saveResult = await this.tradeAreaRepository.save(ta);
    if (saveResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(toOutput(ta));
  }
}

function toOutput(ta: TradeArea): CreateTradeAreaOutput {
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
