/**
 * @what CompetitorName 値オブジェクトのテスト
 * @why 1〜100文字のバリデーション、トリム処理、等価性を検証
 */

import { describe, it, expect } from 'vitest';
import { CompetitorName } from '../competitor-name.js';

describe('CompetitorName', () => {
  describe('create', () => {
    it('正常な競合店舗名を作成できる', () => {
      const name = CompetitorName.create('競合店舗A');
      expect(name.value).toBe('競合店舗A');
    });

    it('前後の空白をトリムする', () => {
      const name = CompetitorName.create('  競合店舗A  ');
      expect(name.value).toBe('競合店舗A');
    });

    it('1文字の名前を作成できる', () => {
      const name = CompetitorName.create('A');
      expect(name.value).toBe('A');
    });

    it('100文字の名前を作成できる', () => {
      const value = 'あ'.repeat(100);
      const name = CompetitorName.create(value);
      expect(name.value).toBe(value);
    });

    it('空文字列でエラーをスローする', () => {
      expect(() => CompetitorName.create('')).toThrow('Invalid competitor name');
    });

    it('空白のみでエラーをスローする', () => {
      expect(() => CompetitorName.create('   ')).toThrow('Invalid competitor name');
    });

    it('101文字でエラーをスローする', () => {
      const value = 'あ'.repeat(101);
      expect(() => CompetitorName.create(value)).toThrow('Invalid competitor name');
    });
  });

  describe('equals', () => {
    it('同じ値なら等価', () => {
      const a = CompetitorName.create('競合店舗A');
      const b = CompetitorName.create('競合店舗A');
      expect(a.equals(b)).toBe(true);
    });

    it('異なる値なら非等価', () => {
      const a = CompetitorName.create('競合店舗A');
      const b = CompetitorName.create('競合店舗B');
      expect(a.equals(b)).toBe(false);
    });
  });
});
