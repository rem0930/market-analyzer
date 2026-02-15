/**
 * @what 競合店舗検索ユースケース
 * @why 店舗の位置を基準に周辺競合を検索し、登録済みフラグ付きで返す（FR-004）
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  StoreId,
  type CompetitorRepository,
  type StoreRepository,
  type CompetitorSearchProvider,
} from '../../domain/index.js';

export interface SearchCompetitorsInput {
  storeId: string;
  userId: string;
  radiusMeters: number;
  keyword: string;
  maxResults?: number;
}

export interface SearchCompetitorItemOutput {
  name: string;
  longitude: number;
  latitude: number;
  googlePlaceId: string;
  category: string;
  address: string;
  distanceMeters: number;
  alreadyRegistered: boolean;
}

export interface SearchCompetitorsOutput {
  results: SearchCompetitorItemOutput[];
  total: number;
  searchCenter: {
    longitude: number;
    latitude: number;
  };
}

export type SearchCompetitorsError = 'store_not_found' | 'search_provider_error';

export class SearchCompetitorsUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository,
    private readonly searchProvider: CompetitorSearchProvider
  ) {}

  async execute(
    input: SearchCompetitorsInput
  ): AsyncResult<SearchCompetitorsOutput, SearchCompetitorsError> {
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

    const store = storeResult.value;

    // Search nearby competitors via provider
    let searchResults;
    try {
      searchResults = await this.searchProvider.searchNearby(
        store.location,
        input.radiusMeters,
        input.keyword,
        input.maxResults
      );
    } catch {
      return Result.fail('search_provider_error');
    }

    // Check which results are already registered
    const placeIds = searchResults.map((r) => r.googlePlaceId);
    const existingResult = await this.competitorRepository.findByGooglePlaceIds(
      input.storeId,
      placeIds
    );

    const registeredPlaceIds = new Set<string>();
    if (existingResult.isSuccess()) {
      for (const c of existingResult.value) {
        if (c.googlePlaceId !== null) {
          registeredPlaceIds.add(c.googlePlaceId);
        }
      }
    }

    // Map results with alreadyRegistered flag
    const results: SearchCompetitorItemOutput[] = searchResults.map((r) => ({
      name: r.name,
      longitude: r.longitude,
      latitude: r.latitude,
      googlePlaceId: r.googlePlaceId,
      category: r.category,
      address: r.address,
      distanceMeters: r.distanceMeters,
      alreadyRegistered: registeredPlaceIds.has(r.googlePlaceId),
    }));

    return Result.ok({
      results,
      total: results.length,
      searchCenter: {
        longitude: store.location.longitude,
        latitude: store.location.latitude,
      },
    });
  }
}
