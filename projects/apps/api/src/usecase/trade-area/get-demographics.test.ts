/**
 * @what 人口統計データ取得ユースケースのテスト
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { GetDemographicsUseCase } from './get-demographics.js';
import { CreateTradeAreaUseCase } from './create-trade-area.js';
import { InMemoryTradeAreaRepository } from '../../infrastructure/repositories/in-memory-trade-area-repository.js';
import { MockDemographicDataProvider } from '../../infrastructure/services/mock-demographic-data-provider.js';

describe('GetDemographicsUseCase', () => {
  let repository: InMemoryTradeAreaRepository;
  let demographicProvider: MockDemographicDataProvider;
  let getDemoUseCase: GetDemographicsUseCase;
  let createUseCase: CreateTradeAreaUseCase;

  const userId = '550e8400-e29b-41d4-a716-446655440000';

  beforeEach(() => {
    repository = new InMemoryTradeAreaRepository();
    demographicProvider = new MockDemographicDataProvider();
    getDemoUseCase = new GetDemographicsUseCase(repository, demographicProvider);
    createUseCase = new CreateTradeAreaUseCase(repository);
  });

  it('should return demographic data for a trade area', async () => {
    const created = await createUseCase.execute({
      userId,
      name: 'Test Area',
      longitude: 139.7671,
      latitude: 35.6812,
      radiusKm: 3,
      requestId: 'req-1',
    });

    const result = await getDemoUseCase.execute({
      tradeAreaId: created.value.id,
      userId,
    });

    expect(result.isSuccess()).toBe(true);
    const data = result.value;
    expect(data.tradeAreaId).toBe(created.value.id);
    expect(data.population).toBeGreaterThan(0);
    expect(data.households).toBeGreaterThan(0);
    expect(data.averageIncome).toBeGreaterThan(0);
    expect(data.ageDistribution).toHaveLength(7);
  });

  it('should return deterministic data for same coordinates', async () => {
    const created1 = await createUseCase.execute({
      userId,
      name: 'Area A',
      longitude: 139.7671,
      latitude: 35.6812,
      radiusKm: 3,
      requestId: 'req-1',
    });
    const created2 = await createUseCase.execute({
      userId,
      name: 'Area B',
      longitude: 139.7671,
      latitude: 35.6812,
      radiusKm: 3,
      requestId: 'req-2',
    });

    const result1 = await getDemoUseCase.execute({
      tradeAreaId: created1.value.id,
      userId,
    });
    const result2 = await getDemoUseCase.execute({
      tradeAreaId: created2.value.id,
      userId,
    });

    expect(result1.value.population).toBe(result2.value.population);
    expect(result1.value.households).toBe(result2.value.households);
    expect(result1.value.averageIncome).toBe(result2.value.averageIncome);
  });

  it('should fail when trade area not found', async () => {
    const result = await getDemoUseCase.execute({
      tradeAreaId: '660e8400-e29b-41d4-a716-446655440000',
      userId,
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('not_found');
  });

  it('should fail with invalid id', async () => {
    const result = await getDemoUseCase.execute({
      tradeAreaId: 'invalid',
      userId,
    });
    expect(result.isFailure()).toBe(true);
    expect(result.error).toBe('invalid_id');
  });
});
