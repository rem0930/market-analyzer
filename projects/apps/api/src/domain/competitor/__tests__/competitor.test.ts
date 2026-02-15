/**
 * @what Competitor 集約ルートのテスト
 * @why 生成・復元・ビジネスメソッド・ドメインイベントを検証
 */

import { describe, it, expect } from 'vitest';
import { CompetitorId, Competitor, CompetitorCreatedEvent } from '../competitor.js';
import { CompetitorName } from '../competitor-name.js';
import { CompetitorSource } from '../competitor-source.js';
import { CenterPoint } from '../../trade-area/center-point.js';

const VALID_UUID = '550e8400-e29b-41d4-a716-446655440000';
const ANOTHER_UUID = '660e8400-e29b-41d4-a716-446655440000';
const STORE_ID = 'store-550e8400-e29b-41d4-a716-446655440000';

function createDefaultCompetitor() {
  return Competitor.create({
    id: new CompetitorId(VALID_UUID),
    storeId: STORE_ID,
    name: CompetitorName.create('競合店舗A'),
    location: CenterPoint.create(139.6917, 35.6895),
    source: CompetitorSource.create('manual'),
    googlePlaceId: null,
    category: null,
    causationId: 'cmd-001',
    correlationId: 'corr-001',
  });
}

describe('CompetitorId', () => {
  it('有効なUUIDで作成できる', () => {
    const id = new CompetitorId(VALID_UUID);
    expect(id.value).toBe(VALID_UUID);
  });

  it('無効なUUIDでエラーをスローする', () => {
    expect(() => new CompetitorId('invalid')).toThrow('Invalid UUID');
  });

  it('同じUUIDなら等価', () => {
    const a = new CompetitorId(VALID_UUID);
    const b = new CompetitorId(VALID_UUID);
    expect(a.equals(b)).toBe(true);
  });
});

describe('Competitor', () => {
  describe('create', () => {
    it('正常に競合店舗を作成できる', () => {
      const result = createDefaultCompetitor();

      expect(result).toBeSuccess();
      const competitor = result.value;
      expect(competitor.id.value).toBe(VALID_UUID);
      expect(competitor.storeId).toBe(STORE_ID);
      expect(competitor.name.value).toBe('競合店舗A');
      expect(competitor.location.longitude).toBe(139.6917);
      expect(competitor.location.latitude).toBe(35.6895);
      expect(competitor.source.value).toBe('manual');
      expect(competitor.googlePlaceId).toBeNull();
      expect(competitor.category).toBeNull();
      expect(competitor.createdAt).toBeInstanceOf(Date);
      expect(competitor.updatedAt).toBeInstanceOf(Date);
      expect(competitor.version).toBe(0);
    });

    it('google_places ソースで作成できる', () => {
      const result = Competitor.create({
        id: new CompetitorId(VALID_UUID),
        storeId: STORE_ID,
        name: CompetitorName.create('Google店舗'),
        location: CenterPoint.create(139.0, 35.0),
        source: CompetitorSource.create('google_places'),
        googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
        category: 'restaurant',
        causationId: 'cmd-002',
        correlationId: 'corr-002',
      });

      expect(result).toBeSuccess();
      const competitor = result.value;
      expect(competitor.source.value).toBe('google_places');
      expect(competitor.googlePlaceId).toBe('ChIJN1t_tDeuEmsRUsoyG83frY4');
      expect(competitor.category).toBe('restaurant');
    });

    it('CompetitorCreatedEvent が発行される', () => {
      const result = createDefaultCompetitor();
      const competitor = result.value;
      const events = competitor.getDomainEvents();

      expect(events).toHaveLength(1);
      const event = events[0] as CompetitorCreatedEvent;
      expect(event.eventType).toBe('CompetitorCreated');
      expect(event.competitorId).toBe(VALID_UUID);
      expect(event.storeId).toBe(STORE_ID);
      expect(event.name).toBe('競合店舗A');
    });
  });

  describe('restore', () => {
    it('永続化データから競合店舗を復元できる', () => {
      const createdAt = new Date('2025-01-01');
      const updatedAt = new Date('2025-06-01');

      const competitor = Competitor.restore(
        new CompetitorId(VALID_UUID),
        STORE_ID,
        CompetitorName.create('復元競合店舗'),
        CenterPoint.create(135.5023, 34.6937),
        CompetitorSource.create('google_places'),
        'place-id-123',
        'retail',
        createdAt,
        updatedAt,
        3
      );

      expect(competitor.id.value).toBe(VALID_UUID);
      expect(competitor.storeId).toBe(STORE_ID);
      expect(competitor.name.value).toBe('復元競合店舗');
      expect(competitor.source.value).toBe('google_places');
      expect(competitor.googlePlaceId).toBe('place-id-123');
      expect(competitor.category).toBe('retail');
      expect(competitor.createdAt).toBe(createdAt);
      expect(competitor.updatedAt).toBe(updatedAt);
      expect(competitor.version).toBe(3);
      expect(competitor.getDomainEvents()).toHaveLength(0);
    });
  });

  describe('rename', () => {
    it('異なる名前にリネームできる', () => {
      const competitor = createDefaultCompetitor().value;
      const newName = CompetitorName.create('新競合店舗名');

      const result = competitor.rename(newName);

      expect(result).toBeSuccess();
      expect(competitor.name.value).toBe('新競合店舗名');
      expect(competitor.version).toBe(1);
    });

    it('同じ名前へのリネームは失敗する', () => {
      const competitor = createDefaultCompetitor().value;
      const sameName = CompetitorName.create('競合店舗A');

      const result = competitor.rename(sameName);

      expect(result).toBeFailureWithError('same_name');
    });

    it('リネームで updatedAt が更新される', () => {
      const competitor = createDefaultCompetitor().value;
      const before = competitor.updatedAt;

      const newName = CompetitorName.create('更新競合店舗');
      competitor.rename(newName);

      expect(competitor.updatedAt.getTime()).toBeGreaterThanOrEqual(before.getTime());
    });
  });

  describe('updateLocation', () => {
    it('位置情報を更新できる', () => {
      const competitor = createDefaultCompetitor().value;
      const newLocation = CenterPoint.create(135.5023, 34.6937);

      competitor.updateLocation(newLocation);

      expect(competitor.location.longitude).toBe(135.5023);
      expect(competitor.location.latitude).toBe(34.6937);
      expect(competitor.version).toBe(1);
    });
  });

  describe('updateCategory', () => {
    it('カテゴリを更新できる', () => {
      const competitor = createDefaultCompetitor().value;

      competitor.updateCategory('restaurant');

      expect(competitor.category).toBe('restaurant');
      expect(competitor.version).toBe(1);
    });

    it('カテゴリを null に更新できる', () => {
      const result = Competitor.create({
        id: new CompetitorId(VALID_UUID),
        storeId: STORE_ID,
        name: CompetitorName.create('競合店舗'),
        location: CenterPoint.create(139.0, 35.0),
        source: CompetitorSource.create('manual'),
        googlePlaceId: null,
        category: 'retail',
        causationId: 'cmd-001',
        correlationId: 'corr-001',
      });
      const competitor = result.value;

      competitor.updateCategory(null);

      expect(competitor.category).toBeNull();
    });
  });

  describe('equals', () => {
    it('同じIDなら等価', () => {
      const a = createDefaultCompetitor().value;
      const b = Competitor.restore(
        new CompetitorId(VALID_UUID),
        'other-store',
        CompetitorName.create('別競合店舗'),
        CenterPoint.create(0, 0),
        CompetitorSource.create('manual'),
        null,
        null,
        new Date(),
        new Date(),
        0
      );
      expect(a.equals(b)).toBe(true);
    });

    it('異なるIDなら非等価', () => {
      const a = createDefaultCompetitor().value;
      const b = Competitor.restore(
        new CompetitorId(ANOTHER_UUID),
        STORE_ID,
        CompetitorName.create('競合店舗A'),
        CenterPoint.create(139.6917, 35.6895),
        CompetitorSource.create('manual'),
        null,
        null,
        new Date(),
        new Date(),
        0
      );
      expect(a.equals(b)).toBe(false);
    });
  });
});
