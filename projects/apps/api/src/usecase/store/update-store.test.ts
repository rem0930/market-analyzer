/**
 * @what 店舗更新ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateStoreUseCase } from './update-store.js';
import { CreateStoreUseCase } from './create-store.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('UpdateStoreUseCase', () => {
  let repository: InMemoryStoreRepository;
  let updateUseCase: UpdateStoreUseCase;
  let createUseCase: CreateStoreUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryStoreRepository();
    updateUseCase = new UpdateStoreUseCase(repository);
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

  it('店舗名を更新できる', async () => {
    const created = await createStore();
    const result = await updateUseCase.execute({
      storeId: created.id,
      userId,
      name: '新店舗名',
    });

    expect(result).toBeSuccess();
    expect(result.value.name).toBe('新店舗名');
    expect(result.value.address).toBe('東京都渋谷区');
  });

  it('住所を更新できる', async () => {
    const created = await createStore();
    const result = await updateUseCase.execute({
      storeId: created.id,
      userId,
      address: '大阪府大阪市',
    });

    expect(result).toBeSuccess();
    expect(result.value.address).toBe('大阪府大阪市');
  });

  it('位置情報を更新できる', async () => {
    const created = await createStore();
    const result = await updateUseCase.execute({
      storeId: created.id,
      userId,
      longitude: 135.5023,
      latitude: 34.6937,
    });

    expect(result).toBeSuccess();
    expect(result.value.longitude).toBe(135.5023);
    expect(result.value.latitude).toBe(34.6937);
  });

  it('他人の店舗は更新できない', async () => {
    const created = await createStore();
    const result = await updateUseCase.execute({
      storeId: created.id,
      userId: 'other-user',
      name: '不正更新',
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('存在しない店舗は not_found', async () => {
    const result = await updateUseCase.execute({
      storeId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
      name: '不存在',
    });

    expect(result).toBeFailureWithError('not_found');
  });

  it('無効な店舗名で失敗する', async () => {
    const created = await createStore();
    const result = await updateUseCase.execute({
      storeId: created.id,
      userId,
      name: '',
    });

    expect(result).toBeFailureWithError('invalid_name');
  });

  it('無効な住所で失敗する', async () => {
    const created = await createStore();
    const result = await updateUseCase.execute({
      storeId: created.id,
      userId,
      address: '',
    });

    expect(result).toBeFailureWithError('invalid_address');
  });

  it('無効なIDで invalid_id', async () => {
    const result = await updateUseCase.execute({
      storeId: 'invalid',
      userId,
      name: '更新',
    });

    expect(result).toBeFailureWithError('invalid_id');
  });
});
