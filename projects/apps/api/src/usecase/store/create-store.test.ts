/**
 * @what 店舗作成ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateStoreUseCase } from './create-store.js';
import { InMemoryStoreRepository } from '../../infrastructure/repositories/in-memory-store-repository.js';

describe('CreateStoreUseCase', () => {
  let repository: InMemoryStoreRepository;
  let useCase: CreateStoreUseCase;

  beforeEach(() => {
    repository = new InMemoryStoreRepository();
    useCase = new CreateStoreUseCase(repository);
  });

  const validInput = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'テスト店舗',
    address: '東京都渋谷区道玄坂1-1-1',
    longitude: 139.6917,
    latitude: 35.6895,
    requestId: 'req-1',
  };

  it('正常に店舗を作成できる', async () => {
    const result = await useCase.execute(validInput);

    expect(result).toBeSuccess();
    const output = result.value;
    expect(output.name).toBe('テスト店舗');
    expect(output.address).toBe('東京都渋谷区道玄坂1-1-1');
    expect(output.longitude).toBe(139.6917);
    expect(output.latitude).toBe(35.6895);
    expect(output.userId).toBe(validInput.userId);
    expect(output.id).toBeDefined();
    expect(output.createdAt).toBeDefined();
    expect(output.updatedAt).toBeDefined();
  });

  it('無効な店舗名で失敗する', async () => {
    const result = await useCase.execute({ ...validInput, name: '' });
    expect(result).toBeFailureWithError('invalid_name');
  });

  it('無効な住所で失敗する', async () => {
    const result = await useCase.execute({ ...validInput, address: '' });
    expect(result).toBeFailureWithError('invalid_address');
  });

  it('無効な経度で失敗する', async () => {
    const result = await useCase.execute({ ...validInput, longitude: 200 });
    expect(result).toBeFailureWithError('invalid_location');
  });

  it('無効な緯度で失敗する', async () => {
    const result = await useCase.execute({ ...validInput, latitude: -100 });
    expect(result).toBeFailureWithError('invalid_location');
  });
});
