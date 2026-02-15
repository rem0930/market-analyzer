/**
 * @what 店舗取得ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetStoreUseCase } from './get-store.js';
import { CreateStoreUseCase } from './create-store.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('GetStoreUseCase', () => {
  let repository: InMemoryStoreRepository;
  let getUseCase: GetStoreUseCase;
  let createUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryStoreRepository();
    getUseCase = new GetStoreUseCase(repository);
    createUseCase = new CreateStoreUseCase(repository);
  });

  async function createStore() {
    const result = await createUseCase.execute({
      userId,
      name: 'テスト店舗',
      address: '東京都渋谷区',
      longitude: 139.6917,
      latitude: 35.6895,
      requestId: 'req-1',
    });
    return result.value;
  }

  it('自分の店舗を取得できる', async () => {
    const created = await createStore();
    const result = await getUseCase.execute({ storeId: created.id, userId });

    expect(result).toBeSuccess();
    expect(result.value.id).toBe(created.id);
    expect(result.value.name).toBe('テスト店舗');
  });

  it('他人の店舗は取得できない', async () => {
    const created = await createStore();
    const result = await getUseCase.execute({ storeId: created.id, userId: 'other-user' });

    expect(result).toBeFailureWithError('not_found');
  });

  it('存在しない店舗は not_found', async () => {
    const result = await getUseCase.execute({
      storeId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('無効なIDで invalid_id', async () => {
    const result = await getUseCase.execute({ storeId: 'invalid', userId });

    expect(result).toBeFailureWithError('invalid_id');
  });
});
