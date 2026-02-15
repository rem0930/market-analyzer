/**
 * @what 競合店舗削除ユースケース
 */

import { Result, type AsyncResult } from '@monorepo/shared';
import {
  CompetitorId,
  StoreId,
  type CompetitorRepository,
  type StoreRepository,
} from '../../domain/index.js';

export interface DeleteCompetitorInput {
  competitorId: string;
  userId: string;
}

export type DeleteCompetitorError = 'invalid_id' | 'not_found' | 'repository_error';

export class DeleteCompetitorUseCase {
  constructor(
    private readonly competitorRepository: CompetitorRepository,
    private readonly storeRepository: StoreRepository
  ) {}

  async execute(input: DeleteCompetitorInput): AsyncResult<void, DeleteCompetitorError> {
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

    const deleteResult = await this.competitorRepository.delete(competitorId);
    if (deleteResult.isFailure()) {
      return Result.fail('repository_error');
    }

    return Result.ok(undefined);
  }
}
