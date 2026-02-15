/**
 * @what StoreName 値オブジェクトのテスト
 * @why 1〜100文字のバリデーション、トリム処理、等価性を検証
 */

import { describe, it, expect } from 'vitest';
import { StoreName } from '../store-name.js';

describe('StoreName', () => {
  describe('create', () => {
    it('正常な店舗名を作成できる', () => {
      const name = StoreName.create('テスト店舗');
      expect(name.value).toBe('テスト店舗');
    });

    it('前後の空白をトリムする', () => {
      const name = StoreName.create('  テスト店舗  ');
      expect(name.value).toBe('テスト店舗');
    });

    it('1文字の店舗名を作成できる', () => {
      const name = StoreName.create('A');
      expect(name.value).toBe('A');
    });

    it('100文字の店舗名を作成できる', () => {
      const value = 'あ'.repeat(100);
      const name = StoreName.create(value);
      expect(name.value).toBe(value);
    });

    it('空文字列でエラーをスローする', () => {
      expect(() => StoreName.create('')).toThrow('Invalid store name');
    });

    it('空白のみでエラーをスローする', () => {
      expect(() => StoreName.create('   ')).toThrow('Invalid store name');
    });

    it('101文字でエラーをスローする', () => {
      const value = 'あ'.repeat(101);
      expect(() => StoreName.create(value)).toThrow('Invalid store name');
    });
  });

  describe('equals', () => {
    it('同じ値なら等価', () => {
      const a = StoreName.create('テスト店舗');
      const b = StoreName.create('テスト店舗');
      expect(a.equals(b)).toBe(true);
    });

    it('異なる値なら非等価', () => {
      const a = StoreName.create('店舗A');
      const b = StoreName.create('店舗B');
      expect(a.equals(b)).toBe(false);
    });
  });
});
