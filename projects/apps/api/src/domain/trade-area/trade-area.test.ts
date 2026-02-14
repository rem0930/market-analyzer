/**
 * @what TradeArea 集約のユニットテスト
 * @why 集約の作成・リストア・更新・名前変更を検証
 */

import { describe, it, expect } from 'vitest';
import { TradeArea, TradeAreaId, TradeAreaCreatedEvent } from './trade-area.js';
import { CenterPoint } from './center-point.js';
import { Radius } from './radius.js';
import { TradeAreaName } from './trade-area-name.js';

describe('TradeArea', () => {
  const createValidParams = () => ({
    id: new TradeAreaId('550e8400-e29b-41d4-a716-446655440000'),
    userId: '660e8400-e29b-41d4-a716-446655440000',
    name: TradeAreaName.create('Tokyo Station'),
    center: CenterPoint.create(139.7671, 35.6812),
    radius: Radius.create(3),
    causationId: 'causation-1',
    correlationId: 'correlation-1',
  });

  describe('create', () => {
    it('should create a trade area with valid parameters', () => {
      const params = createValidParams();
      const result = TradeArea.create(params);

      expect(result.isSuccess()).toBe(true);
      const ta = result.value;
      expect(ta.id.value).toBe(params.id.value);
      expect(ta.userId).toBe(params.userId);
      expect(ta.name.value).toBe('Tokyo Station');
      expect(ta.center.longitude).toBe(139.7671);
      expect(ta.center.latitude).toBe(35.6812);
      expect(ta.radius.value).toBe(3);
    });

    it('should emit TradeAreaCreatedEvent on creation', () => {
      const params = createValidParams();
      const ta = TradeArea.create(params).value;
      const events = ta.getDomainEvents();

      expect(events).toHaveLength(1);
      expect(events[0]).toBeInstanceOf(TradeAreaCreatedEvent);

      const event = events[0] as TradeAreaCreatedEvent;
      expect(event.tradeAreaId).toBe(params.id.value);
      expect(event.userId).toBe(params.userId);
      expect(event.name).toBe('Tokyo Station');
    });
  });

  describe('restore', () => {
    it('should restore from persisted data without events', () => {
      const id = new TradeAreaId('550e8400-e29b-41d4-a716-446655440000');
      const name = TradeAreaName.create('Restored Area');
      const center = CenterPoint.create(139.7, 35.6);
      const radius = Radius.create(5);
      const now = new Date();

      const ta = TradeArea.restore(id, 'user-1', name, center, radius, now, now, 3);

      expect(ta.id.value).toBe(id.value);
      expect(ta.name.value).toBe('Restored Area');
      expect(ta.version).toBe(3);
      expect(ta.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('rename', () => {
    it('should rename successfully', () => {
      const ta = TradeArea.create(createValidParams()).value;
      ta.clearDomainEvents();

      const result = ta.rename(TradeAreaName.create('New Name'));
      expect(result.isSuccess()).toBe(true);
      expect(ta.name.value).toBe('New Name');
    });

    it('should fail when renaming to same name', () => {
      const ta = TradeArea.create(createValidParams()).value;
      ta.clearDomainEvents();

      const result = ta.rename(TradeAreaName.create('Tokyo Station'));
      expect(result.isFailure()).toBe(true);
      expect(result.error).toBe('same_name');
    });
  });

  describe('updateCenter', () => {
    it('should update center coordinates', () => {
      const ta = TradeArea.create(createValidParams()).value;
      const newCenter = CenterPoint.create(140.0, 36.0);

      ta.updateCenter(newCenter);
      expect(ta.center.longitude).toBe(140.0);
      expect(ta.center.latitude).toBe(36.0);
    });
  });

  describe('updateRadius', () => {
    it('should update radius', () => {
      const ta = TradeArea.create(createValidParams()).value;
      const newRadius = Radius.create(10);

      ta.updateRadius(newRadius);
      expect(ta.radius.value).toBe(10);
    });
  });
});

describe('TradeAreaId', () => {
  it('should create valid TradeAreaId', () => {
    const id = new TradeAreaId('550e8400-e29b-41d4-a716-446655440000');
    expect(id.value).toBe('550e8400-e29b-41d4-a716-446655440000');
  });

  it('should throw on invalid UUID format', () => {
    expect(() => new TradeAreaId('invalid')).toThrow();
  });
});
