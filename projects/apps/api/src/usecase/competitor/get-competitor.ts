/**
 * @what 競合店舗取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  CompetitorId,
  StoreId,
  type CompetitorRepository,
  type StoreRepository,
  type Competitor,
} from '../../domain/index.js';

export interface GetCompetitorInput {
  competitorId: string;
  userId: string;
}

export interface GetCompetitorOutput {
  id: string;
  storeId: string;
  name: string;
  longitude: number;
  latitude: number;
  source: string;
  googlePlaceId: string | null;
  category: string | null;
  createdAt: string;
  updatedAt: string;
}

export type GetCompetitorError = 'invalid_id' | 'not_found' | 'repository_error';

export class GetCompetitorUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(input: GetCompetitorInput): AsyncResult<GetCompetitorOutput, GetCompetitorError> {
    let competitorId: CompetitorId;
    try {
      competitorId = new CompetitorId(input.competitorId);
    } catch {
      return Result.fail('invalid_id');
    }

    const competitorResult = await this.competitorRepository.findById(competitorId);
    if (competitorResult.isFailure()) {
      return Result.fail(competitorResult.error === 'not_found' ? 'not_found' : 'repository_error');
    }

    const competitor = competitorResult.value;

    // Verify store ownership
    let storeId: StoreId;
    try {
      storeId = new StoreId(competitor.storeId);
    } catch {
      return Result.fail('not_found');
    }

    const storeResult = await this.storeRepository.findById(storeId);
    if (storeResult.isFailure()) {
      return Result.fail('not_found');
    }

    if (storeResult.value.userId !== input.userId) {
      return Result.fail('not_found');
    }

    return Result.ok(toOutput(competitor));
  }
}

function toOutput(competitor: Competitor): GetCompetitorOutput {
  return {
    id: competitor.id.value,
    storeId: competitor.storeId,
    name: competitor.name.value,
    longitude: competitor.location.longitude,
    latitude: competitor.location.latitude,
    source: competitor.source.value,
    googlePlaceId: competitor.googlePlaceId,
    category: competitor.category,
    createdAt: competitor.createdAt.toISOString(),
    updatedAt: competitor.updatedAt.toISOString(),
  };
}
