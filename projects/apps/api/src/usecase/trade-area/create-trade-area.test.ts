/**
 * @what 商圏作成ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { CreateTradeAreaUseCase } from './create-trade-area.js';
import { InMemoryTradeAreaRepository } from '../../infrastructure/repositories/in-memory-trade-area-repository.js';

describe('CreateTradeAreaUseCase', () => {
  let repository: InMemoryTradeAreaRepository;
  let useCase: CreateTradeAreaUseCase;

  beforeEach(() => {
    repository = new InMemoryTradeAreaRepository();
    useCase = new CreateTradeAreaUseCase(repository);
  });

  const validInput = {
    userId: '550e8400-e29b-41d4-a716-446655440000',
    name: 'Tokyo Station',
    longitude: 139.7671,
    latitude: 35.6812,
    radiusKm: 3,
    requestId: 'req-1',
  };

  it('should create a trade area successfully', async () => {
    const result = await useCase.execute(validInput);

    expect(result.isSuccess()).toBe(true);
    const output = result.value;
    expect(output.name).toBe('Tokyo Station');
    expect(output.longitude).toBe(139.7671);
    expect(output.latitude).toBe(35.6812);
    expect(output.radiusKm).toBe(3);
    expect(output.userId).toBe(validInput.userId);
  });

  it('should fail with invalid name', async () => {
    const result = await useCase.execute({ ...validInput, name: '' });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_name');
  });

  it('should fail with invalid center coordinates', async () => {
    const result = await useCase.execute({ ...validInput, longitude: 200 });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_center');
  });

  it('should fail with invalid radius', async () => {
    const result = await useCase.execute({ ...validInput, radiusKm: 0 });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_radius');
  });

  it('should fail with radius exceeding max', async () => {
    const result = await useCase.execute({ ...validInput, radiusKm: 51 });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_radius');
  });
});
