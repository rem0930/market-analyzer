/**
 * @what 競合店舗更新ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  CompetitorId,
  CompetitorName,
  CenterPoint,
  StoreId,
  type CompetitorRepository,
  type StoreRepository,
  type Competitor,
} from '../../domain/index.js';

export interface UpdateCompetitorInput {
  competitorId: string;
  userId: string;
  name?: string;
  longitude?: number;
  latitude?: number;
  category?: string | null;
}

export interface UpdateCompetitorOutput {
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

export type UpdateCompetitorError =
  | 'invalid_id'
  | 'invalid_name'
  | 'invalid_location'
  | 'not_found'
  | 'repository_error';

export class UpdateCompetitorUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(
    input: UpdateCompetitorInput
  ): AsyncResult<UpdateCompetitorOutput, UpdateCompetitorError> {
    let competitorId: CompetitorId;
    try {
      competitorId = new CompetitorId(input.competitorId);
    } catch {
      return Result.fail('invalid_id');
    }

    const findResult = await this.competitorRepository.findById(competitorId);
    if (findResult.isFailure()) {
      return Result.fail(findResult.error === 'not_found' ? 'not_found' : 'repository_error');
    }

    const competitor = findResult.value;

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

    if (input.name !== undefined) {
      let newName: CompetitorName;
      try {
        newName = CompetitorName.create(input.name);
      } catch {
        return Result.fail('invalid_name');
      }
      competitor.rename(newName);
    }

    if (input.longitude !== undefined && input.latitude !== undefined) {
      let newLocation: CenterPoint;
      try {
        newLocation = CenterPoint.create(input.longitude, input.latitude);
      } catch {
        return Result.fail('invalid_location');
      }
      competitor.updateLocation(newLocation);
    }

    if (input.category !== undefined) {
      competitor.updateCategory(input.category);
    }

    const updateResult = await this.competitorRepository.update(competitor);
    if (updateResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(toOutput(competitor));
  }
}

function toOutput(competitor: Competitor): UpdateCompetitorOutput {
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
