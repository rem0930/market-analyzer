/**
 * @what 商圏更新ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { UpdateTradeAreaUseCase } from './update-trade-area.js';
import { CreateTradeAreaUseCase } from './create-trade-area.js';
import { InMemoryTradeAreaRepository } from '../../infrastructure/repositories/in-memory-trade-area-repository.js';

describe('UpdateTradeAreaUseCase', () => {
  let repository: InMemoryTradeAreaRepository;
  let createUseCase: CreateTradeAreaUseCase;
  let updateUseCase: UpdateTradeAreaUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryTradeAreaRepository();
    createUseCase = new CreateTradeAreaUseCase(repository);
    updateUseCase = new UpdateTradeAreaUseCase(repository);
  });

  async function createTradeArea() {
    const result = await createUseCase.execute({
      userId,
      name: 'Tokyo Station',
      longitude: 139.7671,
      latitude: 35.6812,
      radiusKm: 3,
      requestId: 'req-1',
    });
    return result.value;
  }

  it('should update name successfully', async () => {
    const ta = await createTradeArea();
    const result = await updateUseCase.execute({
      tradeAreaId: ta.id,
      userId,
      name: 'Shibuya',
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.value.name).toBe('Shibuya');
  });

  it('should update both coordinates successfully', async () => {
    const ta = await createTradeArea();
    const result = await updateUseCase.execute({
      tradeAreaId: ta.id,
      userId,
      longitude: 139.7,
      latitude: 35.65,
    });

    expect(result.isSuccess()).toBe(true);
    expect(result.value.longitude).toBe(139.7);
    expect(result.value.latitude).toBe(35.65);
  });

  it('should fail when only longitude is provided', async () => {
    const ta = await createTradeArea();
    const result = await updateUseCase.execute({
      tradeAreaId: ta.id,
      userId,
      longitude: 140.0,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_center');
  });

  it('should fail when only latitude is provided', async () => {
    const ta = await createTradeArea();
    const result = await updateUseCase.execute({
      tradeAreaId: ta.id,
      userId,
      latitude: 36.0,
    });

    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_center');
  });

  it('should fail for non-existent trade area', async () => {
    const result = await updateUseCase.execute({
      tradeAreaId: '550e8400-e29b-41d4-a716-446655440099',
      userId,
      name: 'Test',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });

  it('should fail when user does not own the trade area', async () => {
    const ta = await createTradeArea();
    const result = await updateUseCase.execute({
      tradeAreaId: ta.id,
      userId: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Hacked',
    });

    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });
});
