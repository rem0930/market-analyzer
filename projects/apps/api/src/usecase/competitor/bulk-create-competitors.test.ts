/**
 * @what BulkCreateCompetitorsUseCase のテスト
 * @why AC-005〜AC-009 をカバー
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { BulkCreateCompetitorsUseCase } from './bulk-create-competitors.js';
import { CreateStoreUseCase } from '../store/create-store.js';
import { CreateCompetitorUseCase } from './create-competitor.js';
import { InMemoryCompetitorRepository } from '../../infrastructure/repositories/in-memory-competitor-repository.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('BulkCreateCompetitorsUseCase', () => {
  let competitorRepository: InMemoryCompetitorRepository;
  let storeRepository: InMemoryStoreRepository;
  let useCase: BulkCreateCompetitorsUseCase;
  let createStoreUseCase: CreateStoreUseCase;
  let createCompetitorUseCase: CreateCompetitorUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    competitorRepository = new InMemoryCompetitorRepository();
    storeRepository = new InMemoryStoreRepository();
    useCase = new BulkCreateCompetitorsUseCase(competitorRepository, storeRepository);
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

  function makeCompetitors(count: number) {
    return Array.from({ length: count }, (_, i) => ({
      name: `テスト競合 ${i + 1}`,
      longitude: 139.7 + i * 0.001,
      latitude: 35.68 + i * 0.001,
      googlePlaceId: `ChIJ_test_${i + 1}`,
      category: 'コンビニ',
    }));
  }

  // AC-005: 一括登録（正常系）
  it('正常に複数の競合を一括登録できる', async () => {
    const store = await createStore();
    const competitors = makeCompetitors(3);

    const result = await useCase.execute({
      storeId: store.id,
      userId,
      competitors,
      requestId: 'req-bulk-1',
    });

    expect(result).toBeSuccess();
    const output = result.value;
    expect(output.created.length).toBe(3);
    expect(output.skipped.length).toBe(0);
    expect(output.total.created).toBe(3);
    expect(output.total.skipped).toBe(0);

    // created items should have competitor fields
    const first = output.created[0];
    expect(first.name).toBe('テスト競合 1');
    expect(first.googlePlaceId).toBe('ChIJ_test_1');
    expect(first.source).toBe('google_places');
  });

  // AC-006: 一括登録（重複スキップ）
  it('登録済みの googlePlaceId はスキップされる', async () => {
    const store = await createStore();

    // 先に1件登録
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '既存競合',
      longitude: 139.7,
      latitude: 35.68,
      source: 'google_places',
      googlePlaceId: 'ChIJ_test_1',
      requestId: 'req-pre',
    });

    const competitors = makeCompetitors(3);
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      competitors,
      requestId: 'req-bulk-2',
    });

    expect(result).toBeSuccess();
    const output = result.value;
    expect(output.created.length).toBe(2);
    expect(output.skipped.length).toBe(1);
    expect(output.skipped[0].googlePlaceId).toBe('ChIJ_test_1');
    expect(output.skipped[0].reason).toBe('already_registered');
    expect(output.total.created).toBe(2);
    expect(output.total.skipped).toBe(1);
  });

  // AC-007: 一括登録（上限超過）
  it('51件以上は too_many_competitors エラーになる', async () => {
    const store = await createStore();
    const competitors = makeCompetitors(51);

    const result = await useCase.execute({
      storeId: store.id,
      userId,
      competitors,
      requestId: 'req-bulk-3',
    });

    expect(result).toBeFailureWithError('too_many_competitors');
  });

  // AC-008: 一括登録（source 自動設定）
  it('作成された競合の source は google_places になる', async () => {
    const store = await createStore();
    const competitors = makeCompetitors(1);

    const result = await useCase.execute({
      storeId: store.id,
      userId,
      competitors,
      requestId: 'req-bulk-4',
    });

    expect(result).toBeSuccess();
    expect(result.value.created[0].source).toBe('google_places');
  });

  // AC-009: 一括登録（店舗未所有）
  it('他人の店舗では store_not_found になる', async () => {
    const store = await createStore();
    const competitors = makeCompetitors(1);

    const result = await useCase.execute({
      storeId: store.id,
      userId: otherUserId,
      competitors,
      requestId: 'req-bulk-5',
    });

    expect(result).toBeFailureWithError('store_not_found');
  });

  // AC-009: 存在しない storeId
  it('存在しない storeId では store_not_found になる', async () => {
    const competitors = makeCompetitors(1);

    const result = await useCase.execute({
      storeId: '00000000-0000-0000-0000-000000000000',
      userId,
      competitors,
      requestId: 'req-bulk-6',
    });

    expect(result).toBeFailureWithError('store_not_found');
  });

  // 全件が既に登録済み
  it('全件が登録済みの場合は created=0, skipped=全件になる', async () => {
    const store = await createStore();

    // 先に2件登録
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '既存1',
      longitude: 139.7,
      latitude: 35.68,
      source: 'google_places',
      googlePlaceId: 'ChIJ_test_1',
      requestId: 'req-pre-1',
    });
    await createCompetitorUseCase.execute({
      storeId: store.id,
      userId,
      name: '既存2',
      longitude: 139.701,
      latitude: 35.681,
      source: 'google_places',
      googlePlaceId: 'ChIJ_test_2',
      requestId: 'req-pre-2',
    });

    const competitors = makeCompetitors(2);
    const result = await useCase.execute({
      storeId: store.id,
      userId,
      competitors,
      requestId: 'req-bulk-all-skipped',
    });

    expect(result).toBeSuccess();
    const output = result.value;
    expect(output.created.length).toBe(0);
    expect(output.skipped.length).toBe(2);
    expect(output.total.created).toBe(0);
    expect(output.total.skipped).toBe(2);
  });

  // 空のリスト
  it('空のリストは empty_competitors エラーになる', async () => {
    const store = await createStore();

    const result = await useCase.execute({
      storeId: store.id,
      userId,
      competitors: [],
      requestId: 'req-bulk-7',
    });

    expect(result).toBeFailureWithError('empty_competitors');
  });
});
