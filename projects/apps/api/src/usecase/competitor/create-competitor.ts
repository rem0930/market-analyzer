/**
 * @what 競合店舗作成ユースケース
 * @why アプリケーション層で競合店舗作成フローをオーケストレーション
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

export interface CreateCompetitorInput {
  storeId: string;
  userId: string;
  name: string;
  longitude: number;
  latitude: number;
  source: string;
  googlePlaceId?: string;
  category?: string;
  requestId: string;
}

export interface CreateCompetitorOutput {
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

export type CreateCompetitorError =
  | 'invalid_name'
  | 'invalid_location'
  | 'invalid_source'
  | 'store_not_found'
  | 'repository_error';

export class CreateCompetitorUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(
    input: CreateCompetitorInput
  ): AsyncResult<CreateCompetitorOutput, CreateCompetitorError> {
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

    let name: CompetitorName;
    try {
      name = CompetitorName.create(input.name);
    } catch {
      return Result.fail('invalid_name');
    }

    let location: CenterPoint;
    try {
      location = CenterPoint.create(input.longitude, input.latitude);
    } catch {
      return Result.fail('invalid_location');
    }

    let source: CompetitorSource;
    try {
      source = CompetitorSource.create(input.source);
    } catch {
      return Result.fail('invalid_source');
    }

    const competitorId = new CompetitorId(crypto.randomUUID());
    const createResult = Competitor.create({
      id: competitorId,
      storeId: input.storeId,
      name,
      location,
      source,
      googlePlaceId: input.googlePlaceId ?? null,
      category: input.category ?? null,
      causationId: input.requestId,
      correlationId: input.requestId,
    });

    if (createResult.isFailure()) {
      return Result.fail('repository_error');
    }

    const competitor = createResult.value;
    const saveResult = await this.competitorRepository.save(competitor);
    if (saveResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(toOutput(competitor));
  }
}

function toOutput(competitor: Competitor): CreateCompetitorOutput {
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
