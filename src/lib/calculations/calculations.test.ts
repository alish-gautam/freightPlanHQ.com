import { describe, expect, it } from 'vitest';
import { calculateCbm, boxVolume, densityFrom, kgM3ToPcf, pcfToKgM3 } from './volume';
import { calculateBillableWeight, type DimRule, type PieceInput } from './dimensional-weight';
import { calculateLcl } from './lcl';
import { calculateGirth } from './girth';
import { recommendBox } from './box-size';

const rule = (o: Partial<DimRule> = {}): DimRule => ({
  divisor: 5000,
  divisorLengthUnit: 'cm',
  divisorWeightUnit: 'kg',
  roundDimensionsUp: false,
  weightRounding: 'none',
  basis: 'shipment',
  ...o,
});
const piece = (o: Partial<PieceInput> = {}): PieceInput => ({
  length: 50,
  width: 40,
  height: 30,
  unit: 'cm',
  quantity: 1,
  weightEach: 5,
  weightUnit: 'kg',
  ...o,
});

describe('CBM', () => {
  it('multiplies L×W×H×qty in metres', () => {
    const r = calculateCbm([{ length: 100, width: 50, height: 40, quantity: 10, unit: 'cm' }]);
    expect(r.totalCbm).toBeCloseTo(2, 10);
    expect(r.totalPieces).toBe(10);
    expect(r.totalWeightKg).toBeNull();
  });
  it('mixes units across rows', () => {
    const r = calculateCbm([
      { length: 1, width: 1, height: 1, quantity: 1, unit: 'm' },
      { length: 1000, width: 1000, height: 1000, quantity: 2, unit: 'mm' },
    ]);
    expect(r.totalCbm).toBeCloseTo(3, 9);
    expect(r.rows[1].cbm).toBeCloseTo(2, 9);
  });
  it('computes density when every row has weight', () => {
    const r = calculateCbm([{ length: 1, width: 1, height: 1, quantity: 1, unit: 'm', weightEach: 100, weightUnit: 'kg' }]);
    expect(r.densityKgM3).toBeCloseTo(100, 9);
    expect(r.densityPcf).toBeCloseTo(6.2428, 3);
  });
  it('density pcf round trip', () => {
    expect(pcfToKgM3(kgM3ToPcf(250))).toBeCloseTo(250, 9);
    expect(densityFrom(100, 1).pcf).toBeCloseTo(kgM3ToPcf(100), 9);
  });
  it('rejects zero volume density', () => {
    expect(() => densityFrom(10, 0)).toThrow();
  });
});

describe('box volume', () => {
  it('reports all units', () => {
    const v = boxVolume(10, 10, 10, 'cm', 2);
    expect(v.each.cm3).toBeCloseTo(1000, 6);
    expect(v.each.litre).toBeCloseTo(1, 9);
    expect(v.total.m3).toBeCloseTo(0.002, 12);
    expect(v.each.in3).toBeCloseTo(61.0237, 3);
  });
});

describe('dimensional weight', () => {
  it('dim > actual', () => {
    const r = calculateBillableWeight([piece()], rule()); // 60000/5000 = 12 kg
    expect(r.totalDimensional).toBeCloseTo(12, 9);
    expect(r.basisWon).toBe('dimensional');
    expect(r.billable).toBeCloseTo(12, 9);
  });
  it('actual > dim', () => {
    const r = calculateBillableWeight([piece({ weightEach: 20 })], rule());
    expect(r.basisWon).toBe('actual');
    expect(r.billable).toBeCloseTo(20, 9);
  });
  it('actual = dim', () => {
    const r = calculateBillableWeight([piece({ weightEach: 12 })], rule());
    expect(r.basisWon).toBe('equal');
    expect(r.billable).toBeCloseTo(12, 9);
  });
  it('supports inch / pound divisor', () => {
    const r = calculateBillableWeight(
      [piece({ length: 20, width: 20, height: 20, unit: 'in', weightEach: 10, weightUnit: 'lb' })],
      rule({ divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb' }),
    );
    expect(r.totalDimensional).toBeCloseTo(8000 / 139, 9);
    expect(r.weightUnit).toBe('lb');
  });
  it('converts cm input to an inch rule', () => {
    const r = calculateBillableWeight(
      [piece({ length: 25.4, width: 25.4, height: 25.4, unit: 'cm', weightEach: 1, weightUnit: 'lb' })],
      rule({ divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb' }),
    );
    expect(r.totalDimensional).toBeCloseTo(1000 / 139, 9);
  });
  it('rounds dimensions up when configured', () => {
    const r = calculateBillableWeight([piece({ length: 10.2, width: 10, height: 10, unit: 'in', weightEach: 1, weightUnit: 'lb' })], rule({ divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', roundDimensionsUp: true }));
    expect(r.totalDimensional).toBeCloseTo((11 * 10 * 10) / 139, 9);
  });
  it('per-piece vs shipment basis differ for mixed pieces', () => {
    const pieces = [piece({ weightEach: 20 }), piece({ weightEach: 1 })]; // dim 12 each
    const ship = calculateBillableWeight(pieces, rule({ basis: 'shipment' }));
    const per = calculateBillableWeight(pieces, rule({ basis: 'piece' }));
    expect(ship.billable).toBeCloseTo(24, 9); // actual 21 vs dim 24
    expect(per.billable).toBeCloseTo(32, 9); // 20 + 12
  });
  it('applies weight rounding up to the step', () => {
    const r = calculateBillableWeight([piece({ weightEach: 12.1 })], rule({ weightRounding: 'half' }));
    expect(r.billable).toBeCloseTo(12.5, 9);
    const w = calculateBillableWeight([piece({ weightEach: 12 })], rule({ weightRounding: 'whole' }));
    expect(w.billable).toBe(12); // exact, no float bump
  });
});

describe('LCL', () => {
  it('CBM > tonnes', () => {
    const r = calculateLcl([{ cbm: 5, weightKg: 1000 }]);
    expect(r.wm).toBe(5);
    expect(r.basis).toBe('measure');
  });
  it('tonnes > CBM', () => {
    const r = calculateLcl([{ cbm: 1, weightKg: 3000 }]);
    expect(r.wm).toBe(3);
    expect(r.basis).toBe('weight');
  });
  it('equal', () => {
    const r = calculateLcl([{ cbm: 2, weightKg: 2000 }]);
    expect(r.basis).toBe('equal');
  });
  it('rate, minimum and fees are user supplied only', () => {
    const none = calculateLcl([{ cbm: 2, weightKg: 100 }]);
    expect(none.baseFreight).toBeNull();
    expect(none.total).toBeNull();
    const r = calculateLcl([{ cbm: 2, weightKg: 100 }], { rate: 50, minimumWm: 3, fixedFees: 20 });
    expect(r.minimumApplied).toBe(true);
    expect(r.baseFreight).toBe(150);
    expect(r.total).toBe(170);
  });
});

describe('girth', () => {
  it('uses the longest side as length', () => {
    const g = calculateGirth([10, 30, 20], 'in');
    expect(g.length).toBe(30);
    expect(g.girth).toBe(60);
    expect(g.lengthPlusGirth).toBe(90);
  });
  it('threshold boundary: below, equal, above', () => {
    const t = (v: number) => calculateGirth([30, 20, 10], 'in', { value: v, unit: 'in' }).withinThreshold;
    expect(t(91)).toBe(true);
    expect(t(90)).toBe(true);
    expect(t(89)).toBe(false);
  });
  it('converts threshold units', () => {
    const g = calculateGirth([76.2, 50.8, 25.4], 'cm', { value: 90, unit: 'in' });
    expect(g.threshold).toBeCloseTo(228.6, 6);
  });
  it('target length threshold evaluates length instead of lengthPlusGirth', () => {
    // 30 length, 20 width, 10 height -> length = 30, lengthPlusGirth = 90
    // Test a threshold of 35 on length -> fits
    const fitLen = calculateGirth([30, 20, 10], 'in', { value: 35, unit: 'in', target: 'length' });
    expect(fitLen.withinThreshold).toBe(true);
    expect(fitLen.margin).toBeCloseTo(5, 6);

    // Test a threshold of 25 on length -> exceeds
    const exceedLen = calculateGirth([30, 20, 10], 'in', { value: 25, unit: 'in', target: 'length' });
    expect(exceedLen.withinThreshold).toBe(false);
    expect(exceedLen.margin).toBeCloseTo(-5, 6);
  });
});

describe('validation and error guards', () => {
  it('densityFrom rejects invalid weights and volumes', () => {
    expect(() => densityFrom(-5, 1)).toThrow();
    expect(() => densityFrom(NaN, 1)).toThrow();
    expect(() => densityFrom(10, 0)).toThrow();
    expect(() => densityFrom(10, -1)).toThrow();
    expect(() => densityFrom(10, NaN)).toThrow();
  });
  it('calculateLcl rejects negative values', () => {
    expect(() => calculateLcl([{ cbm: -1, weightKg: 100 }])).toThrow();
    expect(() => calculateLcl([{ cbm: 1, weightKg: -100 }])).toThrow();
    expect(() => calculateLcl([{ cbm: 1, weightKg: 100 }], { rate: -10 })).toThrow();
    expect(() => calculateLcl([{ cbm: 1, weightKg: 100 }], { minimumWm: -1 })).toThrow();
    expect(() => calculateLcl([{ cbm: 1, weightKg: 100 }], { fixedFees: -5 })).toThrow();
  });
  it('recommendBox rejects invalid inputs', () => {
    const valid = { length: 20, width: 10, height: 5, unit: 'cm' as const, quantity: 1, padding: 2, dividerClearance: 0, boardThickness: 0.3, allowRotation: false };
    expect(() => recommendBox({ ...valid, quantity: 0 })).toThrow();
    expect(() => recommendBox({ ...valid, quantity: -5 })).toThrow();
    expect(() => recommendBox({ ...valid, quantity: 1.5 })).toThrow();
    expect(() => recommendBox({ ...valid, length: 0 })).toThrow();
    expect(() => recommendBox({ ...valid, width: -1 })).toThrow();
    expect(() => recommendBox({ ...valid, padding: -1 })).toThrow();
    expect(() => recommendBox({ ...valid, boardThickness: -0.5 })).toThrow();
  });
});
