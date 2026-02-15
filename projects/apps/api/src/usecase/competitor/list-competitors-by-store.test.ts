/**
 * @what 店舗別競合店舗一覧取得ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ListCompetitorsByStoreUseCase } from './list-competitors-by-store.js';
import { CreateCompetitorUseCase } from './create-competitor.js';
import { CreateStoreUseCase } from '../store/create-store.js';
import { InMemoryCompetitorRepository } from '../../infrastructure/repositories/in-memory-competitor-repository.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('ListCompetitorsByStoreUseCase', () => {
  let competitorRepository: InMemoryCompetitorRepository;
  let storeRepository: InMemoryStoreRepository;
  let listUseCase: ListCompetitorsByStoreUseCase;
  let createCompetitorUseCase: CreateCompetitorUseCase;
  let createStoreUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    competitorRepository = new InMemoryCompetitorRepository();
    storeRepository = new InMemoryStoreRepository();
    listUseCase = new ListCompetitorsByStoreUseCase(competitorRepository, storeRepository);
    createCompetitorUseCase = new CreateCompetitorUseCase(competitorRepository, storeRepository);
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
  });

  async function createStore(uid: string = userId) {
    const result = await createStoreUseCase.execute({
      userId: uid,
      name: 'テスト店舗',
      address: '東京都渋谷区',
      longitude: 139.6917,
      latitude: 35.6895,
      requestId: 'req-1',
    });
    return result.value;
  }

  it('自分の店舗の競合一覧を取得できる', async () => {
    const store = await createStore();
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '競合A',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '競合B',
      longitude: 139.71,
      latitude: 35.691,
      source: 'google_places',
      googlePlaceId: 'place-123',
      requestId: 'req-3',
    });

    const result = await listUseCase.execute({ storeId: store.id, userId });

    expect(result).toBeSuccess();
    expect(result.value.total).toBe(2);
    expect(result.value.competitors).toHaveLength(2);
  });

  it('他人の店舗の競合は取得できない', async () => {
    const store = await createStore();
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '競合A',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });

    const result = await listUseCase.execute({ storeId: store.id, userId: otherUserId });

    expect(result).toBeFailureWithError('store_not_found');
  });

  it('競合店舗がない場合は空配列を返す', async () => {
    const store = await createStore();
    const result = await listUseCase.execute({ storeId: store.id, userId });

    expect(result).toBeSuccess();
    expect(result.value.total).toBe(0);
    expect(result.value.competitors).toHaveLength(0);
  });

  it('存在しない店舗IDで store_not_found', async () => {
    const result = await listUseCase.execute({
      storeId: '770e8400-e29b-41d4-a716-446655440000',
      userId,
    });

    expect(result).toBeFailureWithError('store_not_found');
  });
});
