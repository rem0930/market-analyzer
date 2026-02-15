/**
 * @what 店舗別競合店舗一覧取得ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  StoreId,
  type CompetitorRepository,
  type StoreRepository,
  type Competitor,
} from '../../domain/index.js';

export interface ListCompetitorsByStoreInput {
  storeId: string;
  userId: string;
}

export interface ListCompetitorsByStoreOutput {
  competitors: CompetitorItem[];
  total: number;
}

export interface CompetitorItem {
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

export type ListCompetitorsByStoreError = 'store_not_found' | 'repository_error';

export class ListCompetitorsByStoreUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(
    input: ListCompetitorsByStoreInput
  ): AsyncResult<ListCompetitorsByStoreOutput, ListCompetitorsByStoreError> {
    // Verify store exists and belongs to user
    let storeId: StoreId;
    try {
      storeId = new StoreId(input.storeId);
    } catch {
      return Result.fail('store_not_found');
    }

    const storeResult = await this.storeRepository.findById(storeId);
    if (storeResult.isFailure()) {
      return Result.fail('store_not_found');
    }

    if (storeResult.value.userId !== input.userId) {
      return Result.fail('store_not_found');
    }

    const result = await this.competitorRepository.findByStoreId(input.storeId);
    if (result.isFailure()) {
      return Result.fail('repository_error');
    }

    const items = result.value.map(toItem);
    return Result.ok({ competitors: items, total: items.length });
  }
}

function toItem(competitor: Competitor): CompetitorItem {
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
