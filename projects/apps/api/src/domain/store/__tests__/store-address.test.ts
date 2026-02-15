/**
 * @what StoreAddress 値オブジェクトのテスト
 * @why 1〜500文字のバリデーション、トリム処理、等価性を検証
 */

import { describe, it, expect } from 'vitest';
import { StoreAddress } from '../store-address.js';

describe('StoreAddress', () => {
  describe('create', () => {
    it('正常な住所を作成できる', () => {
      const address = StoreAddress.create('東京都渋谷区道玄坂1-1-1');
      expect(address.value).toBe('東京都渋谷区道玄坂1-1-1');
    });

    it('前後の空白をトリムする', () => {
      const address = StoreAddress.create('  東京都渋谷区  ');
      expect(address.value).toBe('東京都渋谷区');
    });

    it('1文字の住所を作成できる', () => {
      const address = StoreAddress.create('A');
      expect(address.value).toBe('A');
    });

    it('500文字の住所を作成できる', () => {
      const value = 'あ'.repeat(500);
      const address = StoreAddress.create(value);
      expect(address.value).toBe(value);
    });

    it('空文字列でエラーをスローする', () => {
      expect(() => StoreAddress.create('')).toThrow('Invalid store address');
    });

    it('空白のみでエラーをスローする', () => {
      expect(() => StoreAddress.create('   ')).toThrow('Invalid store address');
    });

    it('501文字でエラーをスローする', () => {
      const value = 'あ'.repeat(501);
      expect(() => StoreAddress.create(value)).toThrow('Invalid store address');
    });
  });

  describe('equals', () => {
    it('同じ値なら等価', () => {
      const a = StoreAddress.create('東京都渋谷区');
      const b = StoreAddress.create('東京都渋谷区');
      expect(a.equals(b)).toBe(true);
    });

    it('異なる値なら非等価', () => {
      const a = StoreAddress.create('東京都渋谷区');
      const b = StoreAddress.create('大阪府大阪市');
      expect(a.equals(b)).toBe(false);
    });
  });
});
