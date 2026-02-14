/**
 * @what 商圏一覧取得ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ListTradeAreasUseCase } from './list-trade-areas.js';
import { CreateTradeAreaUseCase } from './create-trade-area.js';
import { InMemoryTradeAreaRepository } from '../../infrastructure/repositories/in-memory-trade-area-repository.js';

describe('ListTradeAreasUseCase', () => {
  let repository: InMemoryTradeAreaRepository;
  let listUseCase: ListTradeAreasUseCase;
  let createUseCase: CreateTradeAreaUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryTradeAreaRepository();
    listUseCase = new ListTradeAreasUseCase(repository);
    createUseCase = new CreateTradeAreaUseCase(repository);
  });

  it('should return empty list when no trade areas', async () => {
    const result = await listUseCase.execute({ userId });
    expect(result.isSuccess()).toBe(true);
    expect(result.value.tradeAreas).toHaveLength(0);
    expect(result.value.total).toBe(0);
  });

  it('should return trade areas for a user', async () => {
    await createUseCase.execute({
      userId,
      name: 'Area 1',
      longitude: 139.7,
      latitude: 35.6,
      radiusKm: 5,
      requestId: 'req-1',
    });
    await createUseCase.execute({
      userId,
      name: 'Area 2',
      longitude: 140.0,
      latitude: 36.0,
      radiusKm: 10,
      requestId: 'req-2',
    });

    const result = await listUseCase.execute({ userId });
    expect(result.isSuccess()).toBe(true);
    expect(result.value.tradeAreas).toHaveLength(2);
    expect(result.value.total).toBe(2);
  });

  it('should not return trade areas from other users', async () => {
    await createUseCase.execute({
      userId: '660e8400-e29b-41d4-a716-446655440000',
      name: 'Other User Area',
      longitude: 139.7,
      latitude: 35.6,
      radiusKm: 5,
      requestId: 'req-1',
    });

    const result = await listUseCase.execute({ userId });
    expect(result.isSuccess()).toBe(true);
    expect(result.value.tradeAreas).toHaveLength(0);
  });
});
