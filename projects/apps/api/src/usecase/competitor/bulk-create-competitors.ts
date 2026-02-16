/**
 * @what 競合店舗一括登録ユースケース
 * @why 検索結果から選択された競合店舗を一括登録し、重複はスキップする（FR-005）
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  Competitor,
  CompetitorId,
  CompetitorName,
  CompetitorSource,
  CenterPoint,
  StoreId,
  type CompetitorRepository,
  type StoreRepository,
} from '../../domain/index.js';

export interface BulkCreateCompetitorItemInput {
  name: string;
  longitude: number;
  latitude: number;
  googlePlaceId: string;
  category?: string;
}

export interface BulkCreateCompetitorsInput {
  storeId: string;
  userId: string;
  competitors: BulkCreateCompetitorItemInput[];
  requestId: string;
}

export interface BulkCreateCompetitorCreatedOutput {
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

export interface BulkCreateCompetitorSkippedOutput {
  googlePlaceId: string;
  reason: 'already_registered';
}

export interface BulkCreateCompetitorsOutput {
  created: BulkCreateCompetitorCreatedOutput[];
  skipped: BulkCreateCompetitorSkippedOutput[];
  total: {
    created: number;
    skipped: number;
  };
}

export type BulkCreateCompetitorsError =
  | 'store_not_found'
  | 'empty_competitors'
  | 'too_many_competitors'
  | 'repository_error';

const MAX_BULK_SIZE = 50;

export class BulkCreateCompetitorsUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(
    input: BulkCreateCompetitorsInput
  ): AsyncResult<BulkCreateCompetitorsOutput, BulkCreateCompetitorsError> {
    // Validate list size
    if (input.competitors.length === 0) {
      return Result.fail('empty_competitors');
    }
    if (input.competitors.length > MAX_BULK_SIZE) {
      return Result.fail('too_many_competitors');
    }

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

    // Check which googlePlaceIds are already registered
    const placeIds = input.competitors.map((c) => c.googlePlaceId);
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

    // Partition into to-create and pre-filtered skips
    const skipped: BulkCreateCompetitorSkippedOutput[] = [];
    const toCreate: Competitor[] = [];

    for (const item of input.competitors) {
      if (registeredPlaceIds.has(item.googlePlaceId)) {
        skipped.push({
          googlePlaceId: item.googlePlaceId,
          reason: 'already_registered',
        });
        continue;
      }

      const competitorId = new CompetitorId(crypto.randomUUID());
      const name = CompetitorName.create(item.name);
      const location = CenterPoint.create(item.longitude, item.latitude);
      const source = CompetitorSource.create('google_places');

      const createResult = Competitor.create({
        id: competitorId,
        storeId: input.storeId,
        name,
        location,
        source,
        googlePlaceId: item.googlePlaceId,
        category: item.category ?? null,
        causationId: input.requestId,
        correlationId: input.requestId,
      });

      if (createResult.isFailure()) {
        return Result.fail('repository_error');
      }

      toCreate.push(createResult.value);
    }

    if (toCreate.length === 0) {
      return Result.ok({
        created: [],
        skipped,
        total: { created: 0, skipped: skipped.length },
      });
    }

    // Atomic bulk save (skipDuplicates handles race conditions at DB level)
    const saveResult = await this.competitorRepository.saveMany(toCreate);
    if (saveResult.isFailure()) {
      return Result.fail('repository_error');
    }

    // Build created output from domain objects
    const created: BulkCreateCompetitorCreatedOutput[] = toCreate.map((competitor) => ({
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
    }));

    return Result.ok({
      created,
      skipped,
      total: {
        created: created.length,
        skipped: skipped.length,
      },
    });
  }
}
