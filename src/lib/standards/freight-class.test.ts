import { describe, expect, it } from 'vitest';
import { DENSITY_BANDS, estimateFreightClass } from './freight-class';
import { convertLength, convertWeight, convertVolume, boxVolumeM3 } from '../units';

describe('freight class bands', () => {
  for (const b of DENSITY_BANDS) {
    it(`class ${b.freightClass} starts exactly at ${b.min}`, () => {
      expect(estimateFreightClass(b.min).freightClass).toBe(b.freightClass);
    });
    it(`just above ${b.min} stays in class ${b.freightClass}`, () => {
      expect(estimateFreightClass(b.min + 1e-4).freightClass).toBe(b.freightClass);
    });
    if (Number.isFinite(b.max)) {
      it(`just below ${b.max} stays in class ${b.freightClass}`, () => {
        expect(estimateFreightClass(b.max - 1e-4).freightClass).toBe(b.freightClass);
      });
    }
  }
  it('treats float noise at a boundary as the boundary value', () => {
    // 6-decimal normalization: representation error must not flip the class
    expect(estimateFreightClass(14.999999999999998).freightClass).toBe(70);
    expect(estimateFreightClass(0.1 * 150).freightClass).toBe(70);
    // a genuinely lower value stays in the lower band
    expect(estimateFreightClass(14.99).freightClass).toBe(85);
  });
  it('extremes', () => {
    expect(estimateFreightClass(0).freightClass).toBe(400);
    expect(estimateFreightClass(0.01).freightClass).toBe(400);
    expect(estimateFreightClass(10000).freightClass).toBe(50);
  });
  it('rejects invalid', () => {
    expect(() => estimateFreightClass(NaN)).toThrow();
    expect(() => estimateFreightClass(-1)).toThrow();
    expect(() => estimateFreightClass(Infinity)).toThrow();
  });
});

describe('units', () => {
  it('converts lengths', () => {
    expect(convertLength(1, 'ft', 'in')).toBeCloseTo(12, 10);
    expect(convertLength(100, 'cm', 'm')).toBeCloseTo(1, 10);
    expect(convertLength(1000, 'mm', 'm')).toBeCloseTo(1, 10);
  });
  it('converts weights', () => {
    expect(convertWeight(1, 'tonne', 'kg')).toBe(1000);
    expect(convertWeight(1, 'kg', 'lb')).toBeCloseTo(2.2046226, 6);
  });
  it('converts volumes', () => {
    expect(convertVolume(1, 'm3', 'litre')).toBeCloseTo(1000, 9);
    expect(convertVolume(1, 'm3', 'ft3')).toBeCloseTo(35.3146667, 5);
    expect(convertVolume(1, 'ft3', 'in3')).toBeCloseTo(1728, 6);
  });
  it('box volume', () => {
    expect(boxVolumeM3(100, 50, 40, 'cm')).toBeCloseTo(0.2, 12);
  });
});
