/**
 * @what 競合店舗削除ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteCompetitorUseCase } from './delete-competitor.js';
import { CreateCompetitorUseCase } from './create-competitor.js';
import { CreateStoreUseCase } from '../store/create-store.js';
import { InMemoryCompetitorRepository } from '../../infrastructure/repositories/in-memory-competitor-repository.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('DeleteCompetitorUseCase', () => {
  let competitorRepository: InMemoryCompetitorRepository;
  let storeRepository: InMemoryStoreRepository;
  let deleteUseCase: DeleteCompetitorUseCase;
  let createCompetitorUseCase: CreateCompetitorUseCase;
  let createStoreUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    competitorRepository = new InMemoryCompetitorRepository();
    storeRepository = new InMemoryStoreRepository();
    deleteUseCase = new DeleteCompetitorUseCase(competitorRepository, storeRepository);
    createCompetitorUseCase = new CreateCompetitorUseCase(competitorRepository, storeRepository);
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
  });

  async function createStoreAndCompetitor() {
    const storeResult = await createStoreUseCase.execute({
      userId,
      name: 'テスト店舗',
      address: '東京都渋谷区',
      longitude: 139.6917,
      latitude: 35.6895,
      requestId: 'req-1',
    });
    const store = storeResult.value;

    const competitorResult = await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '競合店舗A',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });
    return { store, competitor: competitorResult.value };
  }

  it('自分の競合店舗を削除できる', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await deleteUseCase.execute({ competitorId: competitor.id, userId });

    expect(result).toBeSuccess();
  });

  it('他人の競合店舗は削除できない', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await deleteUseCase.execute({
      competitorId: competitor.id,
      userId: 'other-user',
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('存在しない競合店舗は not_found', async () => {
    const result = await deleteUseCase.execute({
      competitorId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('無効なIDで invalid_id', async () => {
    const result = await deleteUseCase.execute({ competitorId: 'invalid', userId });

    expect(result).toBeFailureWithError('invalid_id');
  });
});
