/**
 * @what 商圏取得ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetTradeAreaUseCase } from './get-trade-area.js';
import { CreateTradeAreaUseCase } from './create-trade-area.js';
import { InMemoryTradeAreaRepository } from '../../infrastructure/repositories/in-memory-trade-area-repository.js';

describe('GetTradeAreaUseCase', () => {
  let repository: InMemoryTradeAreaRepository;
  let getUseCase: GetTradeAreaUseCase;
  let createUseCase: CreateTradeAreaUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryTradeAreaRepository();
    getUseCase = new GetTradeAreaUseCase(repository);
    createUseCase = new CreateTradeAreaUseCase(repository);
  });

  it('should get a trade area by id', async () => {
    const created = await createUseCase.execute({
      userId,
      name: 'Test Area',
      longitude: 139.7,
      latitude: 35.6,
      radiusKm: 5,
      requestId: 'req-1',
    });
    const tradeAreaId = created.value.id;

    const result = await getUseCase.execute({ tradeAreaId, userId });
    expect(result.isSuccess()).toBe(true);
    expect(result.value.name).toBe('Test Area');
  });

  it('should fail with invalid id', async () => {
    const result = await getUseCase.execute({ tradeAreaId: 'invalid', userId });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_id');
  });

  it('should fail when not found', async () => {
    const result = await getUseCase.execute({
      tradeAreaId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });

  it('should fail when userId does not match', async () => {
    const created = await createUseCase.execute({
      userId,
      name: 'Test Area',
      longitude: 139.7,
      latitude: 35.6,
      radiusKm: 5,
      requestId: 'req-1',
    });

    const result = await getUseCase.execute({
      tradeAreaId: created.value.id,
      userId: '770e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });
});
