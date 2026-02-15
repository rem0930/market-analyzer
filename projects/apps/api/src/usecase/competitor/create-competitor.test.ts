/**
 * @what 競合店舗作成ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateCompetitorUseCase } from './create-competitor.js';
import { CreateStoreUseCase } from '../store/create-store.js';
import { InMemoryCompetitorRepository } from '../../infrastructure/repositories/in-memory-competitor-repository.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('CreateCompetitorUseCase', () => {
  let competitorRepository: InMemoryCompetitorRepository;
  let storeRepository: InMemoryStoreRepository;
  let useCase: CreateCompetitorUseCase;
  let createStoreUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    competitorRepository = new InMemoryCompetitorRepository();
    storeRepository = new InMemoryStoreRepository();
    useCase = new CreateCompetitorUseCase(competitorRepository, storeRepository);
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
  });

  async function createStore() {
    const result = await createStoreUseCase.execute({
      userId,
      name: 'テスト店舗',
      address: '東京都渋谷区',
      longitude: 139.6917,
      latitude: 35.6895,
      requestId: 'req-1',
    });
    return result.value;
  }

  it('正常に競合店舗を作成できる', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      name: '競合店舗A',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });

    expect(result).toBeSuccess();
    const output = result.value;
    expect(output.name).toBe('競合店舗A');
    expect(output.storeId).toBe(store.id);
    expect(output.longitude).toBe(139.7);
    expect(output.latitude).toBe(35.69);
    expect(output.source).toBe('manual');
    expect(output.googlePlaceId).toBeNull();
    expect(output.category).toBeNull();
    expect(output.id).toBeDefined();
    expect(output.createdAt).toBeDefined();
    expect(output.updatedAt).toBeDefined();
  });

  it('google_places ソースで作成できる', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      name: 'Google競合',
      longitude: 139.7,
      latitude: 35.69,
      source: 'google_places',
      googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
      category: 'restaurant',
      requestId: 'req-2',
    });

    expect(result).toBeSuccess();
    expect(result.value.source).toBe('google_places');
    expect(result.value.googlePlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
    expect(result.value.category).toBe('restaurant');
  });

  it('無効な競合店舗名で失敗する', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      name: '',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });
    expect(result).toBeFailureWithError('invalid_name');
  });

  it('無効な経度で失敗する', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      name: '競合店舗',
      longitude: 200,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });
    expect(result).toBeFailureWithError('invalid_location');
  });

  it('無効なソースで失敗する', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      name: '競合店舗',
      longitude: 139.7,
      latitude: 35.69,
      source: 'invalid_source',
      requestId: 'req-2',
    });
    expect(result).toBeFailureWithError('invalid_source');
  });

  it('存在しない店舗IDで失敗する', async () => {
    const result = await useCase.execute({
      storeId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
      name: '競合店舗',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });
    expect(result).toBeFailureWithError('store_not_found');
  });

  it('他人の店舗には追加できない', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId: 'other-user',
      name: '競合店舗',
      longitude: 139.7,
      latitude: 35.69,
      source: 'manual',
      requestId: 'req-2',
    });
    expect(result).toBeFailureWithError('store_not_found');
  });
});
