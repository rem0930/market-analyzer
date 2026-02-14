/**
 * @what 商圏削除ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { DeleteTradeAreaUseCase } from './delete-trade-area.js';
import { CreateTradeAreaUseCase } from './create-trade-area.js';
import { ListTradeAreasUseCase } from './list-trade-areas.js';
import { InMemoryTradeAreaRepository } from '../../infrastructure/repositories/in-memory-trade-area-repository.js';

describe('DeleteTradeAreaUseCase', () => {
  let repository: InMemoryTradeAreaRepository;
  let deleteUseCase: DeleteTradeAreaUseCase;
  let createUseCase: CreateTradeAreaUseCase;
  let listUseCase: ListTradeAreasUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryTradeAreaRepository();
    deleteUseCase = new DeleteTradeAreaUseCase(repository);
    createUseCase = new CreateTradeAreaUseCase(repository);
    listUseCase = new ListTradeAreasUseCase(repository);
  });

  it('should delete a trade area', async () => {
    const created = await createUseCase.execute({
      userId,
      name: 'To Delete',
      longitude: 139.7,
      latitude: 35.6,
      radiusKm: 5,
      requestId: 'req-1',
    });

    const result = await deleteUseCase.execute({
      tradeAreaId: created.value.id,
      userId,
    });
    expect(result.isSuccess()).toBe(true);

    const listResult = await listUseCase.execute({ userId });
    expect(listResult.value.total).toBe(0);
  });

  it('should fail with invalid id', async () => {
    const result = await deleteUseCase.execute({
      tradeAreaId: 'invalid',
      userId,
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_id');
  });

  it('should fail when not found', async () => {
    const result = await deleteUseCase.execute({
      tradeAreaId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });

  it('should fail when userId does not match', async () => {
    const created = await createUseCase.execute({
      userId,
      name: 'Test',
      longitude: 139.7,
      latitude: 35.6,
      radiusKm: 5,
      requestId: 'req-1',
    });

    const result = await deleteUseCase.execute({
      tradeAreaId: created.value.id,
      userId: '770e8400-e29b-41d4-a716-446655440000',
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });
});
