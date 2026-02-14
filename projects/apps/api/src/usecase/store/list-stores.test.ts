/**
 * @what 店舗一覧取得ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ListStoresUseCase } from './list-stores.js';
import { CreateStoreUseCase } from './create-store.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('ListStoresUseCase', () => {
  let repository: InMemoryStoreRepository;
  let listUseCase: ListStoresUseCase;
  let createUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';
  const otherUserId = '660e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryStoreRepository();
    listUseCase = new ListStoresUseCase(repository);
    createUseCase = new CreateStoreUseCase(repository);
  });

  it('自分の店舗一覧を取得できる', async () => {
    await createUseCase.execute({
      userId,
      name: '店舗A',
      address: '東京都渋谷区',
      longitude: 139.6917,
      latitude: 35.6895,
      requestId: 'req-1',
    });
    await createUseCase.execute({
      userId,
      name: '店舗B',
      address: '大阪府大阪市',
      longitude: 135.5023,
      latitude: 34.6937,
      requestId: 'req-2',
    });

    const result = await listUseCase.execute({ userId });

    expect(result).toBeSuccess();
    expect(result.value.total).toBe(2);
    expect(result.value.stores).toHaveLength(2);
  });

  it('他人の店舗は含まれない', async () => {
    await createUseCase.execute({
      userId,
      name: '自分の店舗',
      address: '東京都渋谷区',
      longitude: 139.6917,
      latitude: 35.6895,
      requestId: 'req-1',
    });
    await createUseCase.execute({
      userId: otherUserId,
      name: '他人の店舗',
      address: '大阪府大阪市',
      longitude: 135.5023,
      latitude: 34.6937,
      requestId: 'req-2',
    });

    const result = await listUseCase.execute({ userId });

    expect(result).toBeSuccess();
    expect(result.value.total).toBe(1);
    expect(result.value.stores[0].name).toBe('自分の店舗');
  });

  it('店舗がない場合は空配列を返す', async () => {
    const result = await listUseCase.execute({ userId });

    expect(result).toBeSuccess();
    expect(result.value.total).toBe(0);
    expect(result.value.stores).toHaveLength(0);
  });
});
