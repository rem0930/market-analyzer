/**
 * @what CompetitorSource 値オブジェクトのテスト
 * @why manual | google_places の enum バリデーションを検証
 */

import { describe, it, expect } from 'vitest';
import { CompetitorSource } from '../competitor-source.js';

describe('CompetitorSource', () => {
  describe('create', () => {
    it('manual で作成できる', () => {
      const source = CompetitorSource.create('manual');
      expect(source.value).toBe('manual');
    });

    it('google_places で作成できる', () => {
      const source = CompetitorSource.create('google_places');
      expect(source.value).toBe('google_places');
    });

    it('無効な値でエラーをスローする', () => {
      expect(() => CompetitorSource.create('invalid')).toThrow('Invalid competitor source');
    });

    it('空文字列でエラーをスローする', () => {
      expect(() => CompetitorSource.create('')).toThrow('Invalid competitor source');
    });
  });

  describe('equals', () => {
    it('同じ値なら等価', () => {
      const a = CompetitorSource.create('manual');
      const b = CompetitorSource.create('manual');
      expect(a.equals(b)).toBe(true);
    });

    it('異なる値なら非等価', () => {
      const a = CompetitorSource.create('manual');
      const b = CompetitorSource.create('google_places');
      expect(a.equals(b)).toBe(false);
    });
  });
});
