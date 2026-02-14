/**
 * @what CenterPoint 値オブジェクトのユニットテスト
 * @why 座標バリデーションの境界値テスト
 */

import { describe, it, expect } from 'vitest';
import { CenterPoint } from './center-point.js';

describe('CenterPoint', () => {
  it('should create with valid coordinates', () => {
    const cp = CenterPoint.create(139.6917, 35.6895);
    expect(cp.longitude).toBe(139.6917);
    expect(cp.latitude).toBe(35.6895);
  });

  it('should accept boundary longitude -180', () => {
    const cp = CenterPoint.create(-180, 0);
    expect(cp.longitude).toBe(-180);
  });

  it('should accept boundary longitude 180', () => {
    const cp = CenterPoint.create(180, 0);
    expect(cp.longitude).toBe(180);
  });

  it('should accept boundary latitude -90', () => {
    const cp = CenterPoint.create(0, -90);
    expect(cp.latitude).toBe(-90);
  });

  it('should accept boundary latitude 90', () => {
    const cp = CenterPoint.create(0, 90);
    expect(cp.latitude).toBe(90);
  });

  it('should throw on longitude < -180', () => {
    expect(() => CenterPoint.create(-180.1, 0)).toThrow();
  });

  it('should throw on longitude > 180', () => {
    expect(() => CenterPoint.create(180.1, 0)).toThrow();
  });

  it('should throw on latitude < -90', () => {
    expect(() => CenterPoint.create(0, -90.1)).toThrow();
  });

  it('should throw on latitude > 90', () => {
    expect(() => CenterPoint.create(0, 90.1)).toThrow();
  });

  it('should throw on NaN longitude', () => {
    expect(() => CenterPoint.create(NaN, 0)).toThrow();
  });

  it('should throw on Infinity latitude', () => {
    expect(() => CenterPoint.create(0, Infinity)).toThrow();
  });

  it('should compare equality correctly', () => {
    const cp1 = CenterPoint.create(139.6917, 35.6895);
    const cp2 = CenterPoint.create(139.6917, 35.6895);
    const cp3 = CenterPoint.create(140.0, 35.6895);

    expect(cp1.equals(cp2)).toBe(true);
    expect(cp1.equals(cp3)).toBe(false);
  });
});
