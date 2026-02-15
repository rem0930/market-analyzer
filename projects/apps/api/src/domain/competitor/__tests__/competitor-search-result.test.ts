/**
 * @what CompetitorSearchResult 値オブジェクトのテスト
 * @why 検索結果の座標バリデーション・必須フィールド・距離を検証（AC-013）
 */

import { describe, it, expect } from 'vitest';
import { CompetitorSearchResult } from '../competitor-search-result.js';

describe('CompetitorSearchResult', () => {
  const validProps = {
    name: 'セブンイレブン 東京駅前店',
    longitude: 139.7671,
    latitude: 35.6812,
    googlePlaceId: 'ChIJN1t_tDeuEmsRUsoyG83frY4',
    category: 'コンビニ',
    address: '東京都千代田区丸の内1-9-1',
    distanceMeters: 350.5,
  };

  describe('create', () => {
    it('有効なプロパティで作成できる', () => {
      const result = CompetitorSearchResult.create(validProps);
      expect(result.name).toBe(validProps.name);
      expect(result.longitude).toBe(validProps.longitude);
      expect(result.latitude).toBe(validProps.latitude);
      expect(result.googlePlaceId).toBe(validProps.googlePlaceId);
      expect(result.category).toBe(validProps.category);
      expect(result.address).toBe(validProps.address);
      expect(result.distanceMeters).toBe(validProps.distanceMeters);
    });

    it('distanceMeters が 0 で作成できる', () => {
      const result = CompetitorSearchResult.create({ ...validProps, distanceMeters: 0 });
      expect(result.distanceMeters).toBe(0);
    });
  });

  describe('座標バリデーション', () => {
    it('経度が 180 を超えるとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, longitude: 181 })).toThrow();
    });

    it('経度が -180 未満だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, longitude: -181 })).toThrow();
    });

    it('緯度が 90 を超えるとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, latitude: 91 })).toThrow();
    });

    it('緯度が -90 未満だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, latitude: -91 })).toThrow();
    });

    it('経度が NaN だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, longitude: NaN })).toThrow();
    });

    it('緯度が Infinity だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, latitude: Infinity })).toThrow();
    });
  });

  describe('必須フィールドバリデーション', () => {
    it('名前が空文字列だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, name: '' })).toThrow();
    });

    it('googlePlaceId が空文字列だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, googlePlaceId: '' })).toThrow();
    });

    it('address が空文字列だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, address: '' })).toThrow();
    });
  });

  describe('distanceMeters バリデーション', () => {
    it('負の距離だとエラー', () => {
      expect(() => CompetitorSearchResult.create({ ...validProps, distanceMeters: -1 })).toThrow();
    });
  });

  describe('equals', () => {
    it('同じ googlePlaceId なら等価', () => {
      const a = CompetitorSearchResult.create(validProps);
      const b = CompetitorSearchResult.create(validProps);
      expect(a.equals(b)).toBe(true);
    });

    it('異なる googlePlaceId なら非等価', () => {
      const a = CompetitorSearchResult.create(validProps);
      const b = CompetitorSearchResult.create({
        ...validProps,
        googlePlaceId: 'different-id',
      });
      expect(a.equals(b)).toBe(false);
    });
  });
});
