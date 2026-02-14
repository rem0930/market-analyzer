/**
 * @what Radius 値オブジェクトのユニットテスト
 * @why 半径バリデーションの境界値テスト
 */

import { describe, it, expect } from 'vitest';
import { Radius } from './radius.js';

describe('Radius', () => {
  it('should create with valid value', () => {
    const r = Radius.create(5);
    expect(r.value).toBe(5);
  });

  it('should accept minimum value 0.1', () => {
    const r = Radius.create(0.1);
    expect(r.value).toBe(0.1);
  });

  it('should accept maximum value 50', () => {
    const r = Radius.create(50);
    expect(r.value).toBe(50);
  });

  it('should throw on value < 0.1', () => {
    expect(() => Radius.create(0.09)).toThrow();
  });

  it('should throw on value > 50', () => {
    expect(() => Radius.create(50.1)).toThrow();
  });

  it('should throw on zero', () => {
    expect(() => Radius.create(0)).toThrow();
  });

  it('should throw on negative', () => {
    expect(() => Radius.create(-1)).toThrow();
  });

  it('should throw on NaN', () => {
    expect(() => Radius.create(NaN)).toThrow();
  });

  it('should throw on Infinity', () => {
    expect(() => Radius.create(Infinity)).toThrow();
  });

  it('should compare equality correctly', () => {
    const r1 = Radius.create(5);
    const r2 = Radius.create(5);
    const r3 = Radius.create(10);

    expect(r1.equals(r2)).toBe(true);
    expect(r1.equals(r3)).toBe(false);
  });
});
