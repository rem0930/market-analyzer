/**
 * @what MockCompetitorSearchProvider のテスト
 * @why 決定論的データ生成、結果件数、座標依存を検証（FR-002）
 */

import { describe, it, expect } from 'vitest';
import { MockCompetitorSearchProvider } from '../mock-competitor-search-provider.js';
import { CenterPoint } from '../../../domain/index.js';

describe('MockCompetitorSearchProvider', () => {
  const provider = new MockCompetitorSearchProvider();
  const center = CenterPoint.create(139.7671, 35.6812);

  describe('searchNearby', () => {
    it('検索結果を返す', async () => {
      const results = await provider.searchNearby(center, 1000, 'コンビニ');
      expect(results.length).toBeGreaterThan(0);
      expect(results.length).toBeLessThanOrEqual(20);
    });

    it('結果に必須フィールドが含まれる', async () => {
      const results = await provider.searchNearby(center, 1000, 'コンビニ');
      const first = results[0];
      expect(first.name).toBeTruthy();
      expect(first.googlePlaceId).toBeTruthy();
      expect(first.category).toBeTruthy();
      expect(first.address).toBeTruthy();
      expect(typeof first.longitude).toBe('number');
      expect(typeof first.latitude).toBe('number');
      expect(typeof first.distanceMeters).toBe('number');
      expect(first.distanceMeters).toBeGreaterThanOrEqual(0);
    });

    it('同じ入力で同じ結果を返す（決定論的）', async () => {
      const results1 = await provider.searchNearby(center, 1000, 'コンビニ');
      const results2 = await provider.searchNearby(center, 1000, 'コンビニ');
      expect(results1.length).toBe(results2.length);
      expect(results1[0].googlePlaceId).toBe(results2[0].googlePlaceId);
      expect(results1[0].name).toBe(results2[0].name);
    });

    it('異なる座標で異なる結果を返す', async () => {
      const otherCenter = CenterPoint.create(140.0, 36.0);
      const results1 = await provider.searchNearby(center, 1000, 'コンビニ');
      const results2 = await provider.searchNearby(otherCenter, 1000, 'コンビニ');
      expect(results1[0].googlePlaceId).not.toBe(results2[0].googlePlaceId);
    });

    it('maxResults で件数を制限できる', async () => {
      const results = await provider.searchNearby(center, 5000, 'コンビニ', 3);
      expect(results.length).toBeLessThanOrEqual(3);
    });

    it('結果は距離順にソートされている', async () => {
      const results = await provider.searchNearby(center, 5000, 'コンビニ');
      for (let i = 1; i < results.length; i++) {
        expect(results[i].distanceMeters).toBeGreaterThanOrEqual(results[i - 1].distanceMeters);
      }
    });

    it('座標が有効な範囲内にある', async () => {
      const results = await provider.searchNearby(center, 5000, 'コンビニ');
      for (const r of results) {
        expect(r.longitude).toBeGreaterThanOrEqual(-180);
        expect(r.longitude).toBeLessThanOrEqual(180);
        expect(r.latitude).toBeGreaterThanOrEqual(-90);
        expect(r.latitude).toBeLessThanOrEqual(90);
      }
    });
  });
});
