/**
 * @what 競合店舗更新ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateCompetitorUseCase } from './update-competitor.js';
import { CreateCompetitorUseCase } from './create-competitor.js';
import { CreateStoreUseCase } from '../store/create-store.js';
import { InMemoryCompetitorRepository } from '../../infrastructure/repositories/in-memory-competitor-repository.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('UpdateCompetitorUseCase', () => {
  let competitorRepository: InMemoryCompetitorRepository;
  let storeRepository: InMemoryStoreRepository;
  let updateUseCase: UpdateCompetitorUseCase;
  let createCompetitorUseCase: CreateCompetitorUseCase;
  let createStoreUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    competitorRepository = new InMemoryCompetitorRepository();
    storeRepository = new InMemoryStoreRepository();
    updateUseCase = new UpdateCompetitorUseCase(competitorRepository, storeRepository);
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

  it('競合店舗名を更新できる', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await updateUseCase.execute({
      competitorId: competitor.id,
      userId,
      name: '新競合店舗名',
    });

    expect(result).toBeSuccess();
    expect(result.value.name).toBe('新競合店舗名');
  });

  it('位置情報を更新できる', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await updateUseCase.execute({
      competitorId: competitor.id,
      userId,
      longitude: 135.5023,
      latitude: 34.6937,
    });

    expect(result).toBeSuccess();
    expect(result.value.longitude).toBe(135.5023);
    expect(result.value.latitude).toBe(34.6937);
  });

  it('カテゴリを更新できる', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await updateUseCase.execute({
      competitorId: competitor.id,
      userId,
      category: 'restaurant',
    });

    expect(result).toBeSuccess();
    expect(result.value.category).toBe('restaurant');
  });

  it('カテゴリをnullにクリアできる', async () => {
    const { competitor } = await createStoreAndCompetitor();
    // First set a category
    await updateUseCase.execute({
      competitorId: competitor.id,
      userId,
      category: 'restaurant',
    });

    const result = await updateUseCase.execute({
      competitorId: competitor.id,
      userId,
      category: null,
    });

    expect(result).toBeSuccess();
    expect(result.value.category).toBeNull();
  });

  it('他人の競合店舗は更新できない', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await updateUseCase.execute({
      competitorId: competitor.id,
      userId: 'other-user',
      name: '不正更新',
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('存在しない競合店舗は not_found', async () => {
    const result = await updateUseCase.execute({
      competitorId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
      name: '不存在',
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('無効な競合店舗名で失敗する', async () => {
    const { competitor } = await createStoreAndCompetitor();
    const result = await updateUseCase.execute({
      competitorId: competitor.id,
      userId,
      name: '',
    });

    expect(result).toBeFailureWithError('invalid_name');
  });

  it('無効なIDで invalid_id', async () => {
    const result = await updateUseCase.execute({
      competitorId: 'invalid',
      userId,
      name: '更新',
    });

    expect(result).toBeFailureWithError('invalid_id');
  });
});
