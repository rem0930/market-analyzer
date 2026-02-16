/**
 * @what SearchCompetitorsUseCase のテスト
 * @why AC-001〜AC-004, AC-011 をカバー
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { SearchCompetitorsUseCase } from './search-competitors.js';
import { CreateStoreUseCase } from '../store/create-store.js';
import { CreateCompetitorUseCase } from './create-competitor.js';
import { InMemoryCompetitorRepository } from '../../infrastructure/repositories/in-memory-competitor-repository.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';
import { MockCompetitorSearchProvider } from '../../infrastructure/services/mock-competitor-search-provider.js';

describe('SearchCompetitorsUseCase', () => {
  let competitorRepository: InMemoryCompetitorRepository;
  let storeRepository: InMemoryStoreRepository;
  let searchProvider: MockCompetitorSearchProvider;
  let useCase: SearchCompetitorsUseCase;
  let createStoreUseCase: CreateStoreUseCase;
  let createCompetitorUseCase: CreateCompetitorUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    competitorRepository = new InMemoryCompetitorRepository();
    storeRepository = new InMemoryStoreRepository();
    searchProvider = new MockCompetitorSearchProvider();
    useCase = new SearchCompetitorsUseCase(competitorRepository, storeRepository, searchProvider);
    createStoreUseCase = new CreateStoreUseCase(storeRepository);
    createCompetitorUseCase = new CreateCompetitorUseCase(competitorRepository, storeRepository);
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

  // AC-001: 競合検索（正常系）
  it('正常に周辺競合を検索できる', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      radiusMeters: 1000,
      keyword: 'コンビニ',
    });

    expect(result).toBeSuccess();
    const output = result.value;
    expect(output.results.length).toBeGreaterThan(0);
    expect(output.searchCenter.longitude).toBe(139.6917);
    expect(output.searchCenter.latitude).toBe(35.6895);
    expect(output.total).toBe(output.results.length);

    const first = output.results[0];
    expect(first.name).toBeTruthy();
    expect(first.googlePlaceId).toBeTruthy();
    expect(typeof first.distanceMeters).toBe('number');
    expect(typeof first.alreadyRegistered).toBe('boolean');
  });

  // AC-002: 競合検索（店舗未所有）
  it('他人の店舗では store_not_found になる', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId: otherUserId,
      radiusMeters: 1000,
      keyword: 'コンビニ',
    });

    expect(result).toBeFailureWithError('store_not_found');
  });

  // AC-002: 存在しない storeId
  it('存在しない storeId では store_not_found になる', async () => {
    const result = await useCase.execute({
      storeId: '00000000-0000-0000-0000-000000000000',
      userId,
      radiusMeters: 1000,
      keyword: 'コンビニ',
    });

    expect(result).toBeFailureWithError('store_not_found');
  });

  // AC-004: 登録済みフラグ
  it('登録済みの競合は alreadyRegistered: true になる', async () => {
    const store = await createStore();

    // 先に検索して結果を取得
    const searchResult = await useCase.execute({
      storeId: store.id,
      userId,
      radiusMeters: 1000,
      keyword: 'コンビニ',
    });
    const firstResult = searchResult.value.results[0];

    // その googlePlaceId で競合を手動登録
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: firstResult.name,
      longitude: firstResult.longitude,
      latitude: firstResult.latitude,
      source: 'google_places',
      googlePlaceId: firstResult.googlePlaceId,
      requestId: 'req-2',
    });

    // 再度検索 → 登録済みフラグが true になる
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      radiusMeters: 1000,
      keyword: 'コンビニ',
    });

    expect(result).toBeSuccess();
    const registeredItem = result.value.results.find(
      (r) => r.googlePlaceId === firstResult.googlePlaceId
    );
    expect(registeredItem).toBeDefined();
    expect(registeredItem!.alreadyRegistered).toBe(true);
  });

  // maxResults 制限
  it('maxResults で結果を制限できる', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      radiusMeters: 5000,
      keyword: 'コンビニ',
      maxResults: 3,
    });

    expect(result).toBeSuccess();
    expect(result.value.results.length).toBeLessThanOrEqual(3);
  });

  // 結果は距離順ソート
  it('結果は距離順にソートされている', async () => {
    const store = await createStore();
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      radiusMeters: 5000,
      keyword: 'コンビニ',
    });

    expect(result).toBeSuccess();
    const results = result.value.results;
    for (let i = 1; i < results.length; i++) {
      expect(results[i].distanceMeters).toBeGreaterThanOrEqual(results[i - 1].distanceMeters);
    }
  });
});
