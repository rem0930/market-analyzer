/**
 * @what 人口統計データ取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  TradeAreaId,
  type TradeAreaRepository,
  type DemographicDataProvider,
  type AgeDistributionEntry,
} from '../../domain/index.js';

export interface GetDemographicsInput {
  tradeAreaId: string;
  userId: string;
}

export interface GetDemographicsOutput {
  tradeAreaId: string;
  population: number;
  households: number;
  averageIncome: number;
  ageDistribution: AgeDistributionEntry[];
}

export type GetDemographicsError = 'invalid_id' | 'not_found' | 'repository_error';

export class GetDemographicsUseCase {
  constructor(
    private readonly tradeAreaRepository: TradeAreaRepository,
    private readonly demographicDataProvider: DemographicDataProvider
  ) {}

  async execute(
    input: GetDemographicsInput
  ): AsyncResult<GetDemographicsOutput, GetDemographicsError> {
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

    const demographics = await this.demographicDataProvider.getDemographics(
      ta.id.value,
      ta.center,
      ta.radius
    );

    return Result.ok({
      tradeAreaId: ta.id.value,
      population: demographics.population,
      households: demographics.households,
      averageIncome: demographics.averageIncome,
      ageDistribution: [...demographics.ageDistribution],
    });
  }
}
