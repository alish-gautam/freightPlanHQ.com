import { describe, expect, it } from 'vitest';
import { calculateCbm, boxVolume, densityFrom, kgM3ToPcf, pcfToKgM3 } from './volume';
import { calculateBillableWeight, describeBasis, type DimRule, type PieceInput } from './dimensional-weight';
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
  it('calculates multi-row mixed-unit shipment (in, cm, mm) accurately', () => {
    // Row 1 (inches): 20 × 20 × 20 in, qty 5 -> (0.508 m)^3 * 5 = 0.131096512 * 5 = 0.65548256 m³
    // Row 2 (cm): 50 × 40 × 30 cm, qty 10 -> (0.5 * 0.4 * 0.3) * 10 = 0.06 * 10 = 0.6 m³
    // Row 3 (mm): 1000 × 800 × 500 mm, qty 2 -> (1.0 * 0.8 * 0.5) * 2 = 0.4 * 2 = 0.8 m³
    const r = calculateCbm([
      { length: 20, width: 20, height: 20, quantity: 5, unit: 'in' },
      { length: 50, width: 40, height: 30, quantity: 10, unit: 'cm' },
      { length: 1000, width: 800, height: 500, quantity: 2, unit: 'mm' },
    ]);
    const expectedCbm = 0.65548256 + 0.6 + 0.8; // 2.05548256 m³
    expect(r.totalCbm).toBeCloseTo(expectedCbm, 8);
    expect(r.totalPieces).toBe(17);
    expect(r.rows[0].cbm).toBeCloseTo(0.65548256, 8);
    expect(r.rows[1].cbm).toBeCloseTo(0.6, 8);
    expect(r.rows[2].cbm).toBeCloseTo(0.8, 8);
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

  describe('verified carrier rules regression suite (Phase 2 & Residual Audit)', () => {

    const uspsRetailRule: DimRule = {
      divisor: 139,
      nonrectangularDivisor: 139,
      nonrectangularFactor: 0.785,
      minVolumeThreshold: 1728,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      nonrectangularDimensionRounding: 'up',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'whole',
      maxRatedWeight: 70,
    };

    const uspsCommercialRule: DimRule = {
      divisor: 139,
      nonrectangularDivisor: 166,
      nonrectangularFactor: 0.785,
      minVolumeThreshold: 1728,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      nonrectangularDimensionRounding: 'nearest',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'whole',
      maxRatedWeight: 70,
    };

    const uspsExpressRule: DimRule = {
      divisor: 139,
      nonrectangularDivisor: 139,
      nonrectangularFactor: 0.785,
      minVolumeThreshold: 1728,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      nonrectangularDimensionRounding: 'up',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'half-then-whole',
      maxRatedWeight: 70,
    };

    const upsDailyRule: DimRule = {
      divisor: 139,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'whole',
    };

    const upsRetailRule: DimRule = {
      divisor: 166,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'whole',
    };

    const fedexDomesticRule: DimRule = {
      divisor: 139,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'nearest',
      roundDimensionsUp: false,
      basis: 'piece',
      weightRounding: 'whole',
    };

    it('USPS Priority Mail does NOT apply DIM weight when volume is below or equal to 1,728 cu in', () => {
      // 12 × 12 × 12 = 1,728 in³ (exactly 1 cu ft), actual 5 lb
      const parcel1728 = piece({ length: 12, width: 12, height: 12, unit: 'in', weightEach: 5, weightUnit: 'lb' });
      const res1728 = calculateBillableWeight([parcel1728], uspsRetailRule);
      expect(res1728.totalDimensional).toBe(0);
      expect(res1728.basisWon).toBe('actual');
      expect(res1728.billable).toBe(5);

      // 10 × 10 × 10 = 1,000 in³ (< 1,728 in³), actual 4.2 lb -> rated 5 lb
      const parcel1000 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 4.2, weightUnit: 'lb' });
      const res1000 = calculateBillableWeight([parcel1000], uspsRetailRule);
      expect(res1000.totalDimensional).toBe(0);
      expect(res1000.basisWon).toBe('actual');
      expect(res1000.billable).toBe(5);
    });

    it('USPS nonrectangular parcel whose unadjusted volume exceeds 1,728 in³ but whose adjusted volume (× 0.785) is <= 1,728 in³ does NOT trigger DIM weight', () => {
      // 15 × 12 × 10 in = 1,800 in³ raw (> 1,728 in³).
      // Adjusted volume: 1,800 × 0.785 = 1,413.0 in³ (<= 1,728 in³).
      // Actual weight: 6.5 lb.
      const nonrectParcel = piece({ length: 15, width: 12, height: 10, unit: 'in', weightEach: 6.5, weightUnit: 'lb', shape: 'nonrectangular' });
      const resNonrect = calculateBillableWeight([nonrectParcel], uspsCommercialRule);

      // Must NOT trigger dimensional weight because adjusted volume 1,413 <= 1,728
      expect(resNonrect.totalDimensional).toBe(0);
      expect(resNonrect.basisWon).toBe('actual');
      // Rated on actual weight rounded up to whole pound = 7 lb
      expect(resNonrect.billable).toBe(7);

      // Rectangular parcel with identical 1,800 in³ dimensions DOES exceed threshold:
      const rectParcel = piece({ length: 15, width: 12, height: 10, unit: 'in', weightEach: 6.5, weightUnit: 'lb', shape: 'rectangular' });
      const resRect = calculateBillableWeight([rectParcel], uspsCommercialRule);
      // Rectangular uses divisor 139: 1,800 / 139 = 12.9496 lb -> calculated dimensional weight = 13 lb -> rated billable = 13 lb
      expect(resRect.totalUnroundedDimensional).toBeCloseTo(1800 / 139, 4);
      expect(resRect.totalDimensional).toBe(13);
      expect(resRect.billable).toBe(13);
      expect(resRect.basisWon).toBe('dimensional');
    });

    it('USPS nonrectangular parcel whose adjusted volume just exceeds 1,728 in³ correctly calculates DIM weight', () => {
      // 14 × 14 × 12 in = 2,352 in³ raw.
      // Adjusted volume: 2,352 × 0.785 = 1,846.32 in³ (> 1,728 in³).
      // Commercial Priority Mail nonrectangular uses divisor 166:
      // Unrounded quotient = 1,846.32 / 166 = 11.1224096... lb -> calculated dimensional weight = 12 lb -> rated billable = 12 lb.
      const nonrectParcel = piece({ length: 14, width: 14, height: 12, unit: 'in', weightEach: 4.0, weightUnit: 'lb', shape: 'nonrectangular' });
      const resNonrect = calculateBillableWeight([nonrectParcel], uspsCommercialRule);

      expect(resNonrect.totalUnroundedDimensional).toBeCloseTo(1846.32 / 166, 4);
      expect(resNonrect.totalDimensional).toBe(12);
      expect(resNonrect.billable).toBe(12);
      expect(resNonrect.basisWon).toBe('dimensional');

      // Rectangular parcel with identical 2,352 in³ uses divisor 139:
      // Unrounded quotient = 2,352 / 139 = 16.92086... lb -> calculated dimensional weight = 17 lb -> rated billable = 17 lb.
      const rectParcel = piece({ length: 14, width: 14, height: 12, unit: 'in', weightEach: 4.0, weightUnit: 'lb', shape: 'rectangular' });
      const resRect = calculateBillableWeight([rectParcel], uspsCommercialRule);
      expect(resRect.totalUnroundedDimensional).toBeCloseTo(2352 / 139, 4);
      expect(resRect.totalDimensional).toBe(17);
      expect(resRect.billable).toBe(17);
    });

    it('USPS Retail Priority Mail applies 0.785 factor and divisor 139 for both shapes', () => {
      // 20 × 16 × 12 = 3,840 in³ > 1,728 in³, actual weight 10 lb
      const rectParcel = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 10, weightUnit: 'lb', shape: 'rectangular' });
      const nonrectParcel = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 10, weightUnit: 'lb', shape: 'nonrectangular' });

      const rectRes = calculateBillableWeight([rectParcel], uspsRetailRule);
      const nonrectRes = calculateBillableWeight([nonrectParcel], uspsRetailRule);

      // Rectangular: 3840 / 139 = 27.625899... lb -> ceil = 28 lb
      expect(rectRes.totalUnroundedDimensional).toBeCloseTo(3840 / 139, 4);
      expect(rectRes.totalDimensional).toBe(28);
      expect(rectRes.billable).toBe(28);

      // Nonrectangular: (3840 * 0.785) / 139 = 3014.4 / 139 = 21.68633... lb -> ceil = 22 lb
      expect(nonrectRes.totalUnroundedDimensional).toBeCloseTo(3014.4 / 139, 4);
      expect(nonrectRes.totalDimensional).toBe(22);
      expect(nonrectRes.billable).toBe(22);
      expect(rectRes.billable).not.toBe(nonrectRes.billable);
    });

    it('USPS Commercial Priority Mail applies divisor 139 for rectangular and 166 for nonrectangular', () => {
      // 20 × 16 × 12 = 3,840 in³, actual weight 10 lb
      const rectParcel = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 10, weightUnit: 'lb', shape: 'rectangular' });
      const nonrectParcel = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 10, weightUnit: 'lb', shape: 'nonrectangular' });

      const rectRes = calculateBillableWeight([rectParcel], uspsCommercialRule);
      const nonrectRes = calculateBillableWeight([nonrectParcel], uspsCommercialRule);

      // Rectangular: 3840 / 139 = 27.625899... -> 28 lb
      expect(rectRes.totalUnroundedDimensional).toBeCloseTo(3840 / 139, 4);
      expect(rectRes.totalDimensional).toBe(28);
      expect(rectRes.billable).toBe(28);

      // Nonrectangular: (3840 * 0.785) / 166 = 3014.4 / 166 = 18.159036... -> 19 lb
      expect(nonrectRes.totalUnroundedDimensional).toBeCloseTo(3014.4 / 166, 4);
      expect(nonrectRes.totalDimensional).toBe(19);
      expect(nonrectRes.billable).toBe(19);
    });

    it('USPS Priority Mail Express Retail and Commercial verify 139 divisor for both shapes', () => {
      const rectParcel = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 5, weightUnit: 'lb', shape: 'rectangular' });
      const nonrectParcel = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 5, weightUnit: 'lb', shape: 'nonrectangular' });

      const rectRes = calculateBillableWeight([rectParcel], uspsExpressRule);
      const nonrectRes = calculateBillableWeight([nonrectParcel], uspsExpressRule);

      // Rectangular: 3840 / 139 = 27.6259 -> 28 lb
      expect(rectRes.totalUnroundedDimensional).toBeCloseTo(3840 / 139, 4);
      expect(rectRes.totalDimensional).toBe(28);
      expect(rectRes.billable).toBe(28);

      // Nonrectangular: 3014.4 / 139 = 21.6863 -> 22 lb
      expect(nonrectRes.totalUnroundedDimensional).toBeCloseTo(3014.4 / 139, 4);
      expect(nonrectRes.totalDimensional).toBe(22);
      expect(nonrectRes.billable).toBe(22);
    });

    it('USPS Commercial Priority Mail rectangular dimensions round UP (DMM 223.1.4.2)', () => {
      // 10.1 in rounds UP to 11 in: 11 × 11 × 11 = 1,331 in³ <= 1,728 in³ (threshold not exceeded)
      const p10_1 = piece({ length: 10.1, width: 10.1, height: 10.1, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'rectangular' });
      const res10_1 = calculateBillableWeight([p10_1], uspsCommercialRule);
      expect(res10_1.totalDimensional).toBe(0);
      expect(res10_1.billable).toBe(2);

      // Exceeding threshold: 12.1 in rounds UP to 13 in: 13 × 13 × 13 = 2,197 in³ > 1,728 in³
      // Divisor 139: 2,197 / 139 = 15.805755... lb -> calculated dimensional weight = 16 lb -> rated billable = 16 lb
      const p12_1 = piece({ length: 12.1, width: 12.1, height: 12.1, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'rectangular' });
      const res12_1 = calculateBillableWeight([p12_1], uspsCommercialRule);
      expect(res12_1.totalUnroundedDimensional).toBeCloseTo(2197 / 139, 4);
      expect(res12_1.totalDimensional).toBe(16);
      expect(res12_1.billable).toBe(16);
      expect(res12_1.basisWon).toBe('dimensional');
    });

    it('USPS Commercial Priority Mail nonrectangular dimensions round OFF to nearest whole inch (DMM 223.1.4.3)', () => {
      // 10.1 in rounds OFF to 10 in: 10 × 10 × 10 = 1,000 in³ * 0.785 = 785 in³ <= 1,728 in³
      const p10_1 = piece({ length: 10.1, width: 10.1, height: 10.1, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'nonrectangular' });
      const res10_1 = calculateBillableWeight([p10_1], uspsCommercialRule);
      expect(res10_1.totalDimensional).toBe(0);
      expect(res10_1.billable).toBe(2);

      // Exceeding threshold: 14.1 in rounds OFF to 14 in:
      // Raw: 14 × 14 × 14 = 2,744 in³. Adjusted: 2,744 × 0.785 = 2,154.04 in³ (> 1,728 in³).
      // Commercial nonrectangular divisor 166: 2,154.04 / 166 = 12.976144... lb -> calculated dimensional weight = 13 lb -> rated billable = 13 lb.
      const p14_1 = piece({ length: 14.1, width: 14.1, height: 14.1, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'nonrectangular' });
      const res14_1 = calculateBillableWeight([p14_1], uspsCommercialRule);
      expect(res14_1.totalUnroundedDimensional).toBeCloseTo(2154.04 / 166, 4);
      expect(res14_1.totalDimensional).toBe(13);
      expect(res14_1.billable).toBe(13);
      expect(res14_1.basisWon).toBe('dimensional');
    });

    it('USPS Commercial Priority Mail nonrectangular half-inch boundaries follow official round-off rule', () => {
      // 10.5 in rounds OFF to 11 in per 0.5 rule: 11 × 11 × 11 = 1,331 in³ * 0.785 = 1,044.835 in³ <= 1,728 in³
      const p10_5 = piece({ length: 10.5, width: 10.5, height: 10.5, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'nonrectangular' });
      const res10_5 = calculateBillableWeight([p10_5], uspsCommercialRule);
      expect(res10_5.totalDimensional).toBe(0);
      expect(res10_5.billable).toBe(2);

      // Half-inch boundary exceeding threshold: 14.5 in rounds OFF to 15 in:
      // Raw: 15 × 15 × 15 = 3,375 in³. Adjusted: 3,375 × 0.785 = 2,649.375 in³ (> 1,728 in³).
      // Commercial nonrectangular divisor 166: 2,649.375 / 166 = 15.96009... lb -> calculated dimensional weight = 16 lb -> rated billable = 16 lb.
      const p14_5 = piece({ length: 14.5, width: 14.5, height: 14.5, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'nonrectangular' });
      const res14_5 = calculateBillableWeight([p14_5], uspsCommercialRule);
      expect(res14_5.totalUnroundedDimensional).toBeCloseTo(2649.375 / 166, 4);
      expect(res14_5.totalDimensional).toBe(16);
      expect(res14_5.billable).toBe(16);

      // Compare with 14.49 in which rounds OFF to 14 in:
      // Adjusted: 14³ × 0.785 = 2,154.04 in³ / 166 = 12.9761 lb -> calculated dimensional weight = 13 lb -> rated billable = 13 lb.
      const p14_49 = piece({ length: 14.49, width: 14.49, height: 14.49, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'nonrectangular' });
      const res14_49 = calculateBillableWeight([p14_49], uspsCommercialRule);
      expect(res14_49.totalUnroundedDimensional).toBeCloseTo(2154.04 / 166, 4);
      expect(res14_49.totalDimensional).toBe(13);
      expect(res14_49.billable).toBe(13);
    });

    it('USPS Retail Priority Mail nonrectangular dimensions still round UP (DMM 123.1.3.3)', () => {
      // 14.1 in nonrectangular rounds UP to 15 in (unlike Commercial which rounds off to 14):
      // Raw: 15³ = 3,375 in³. Adjusted: 3,375 × 0.785 = 2,649.375 in³.
      // Retail divisor 139: 2,649.375 / 139 = 19.06025... lb -> calculated dimensional weight = 20 lb -> rated billable = 20 lb.
      const p14_1 = piece({ length: 14.1, width: 14.1, height: 14.1, unit: 'in', weightEach: 2, weightUnit: 'lb', shape: 'nonrectangular' });
      const resRetail = calculateBillableWeight([p14_1], uspsRetailRule);
      expect(resRetail.totalUnroundedDimensional).toBeCloseTo(2649.375 / 139, 4);
      expect(resRetail.totalDimensional).toBe(20);
      expect(resRetail.billable).toBe(20);
    });

    it('USPS Priority Mail Express verifies dimension ceiling rounding and lower-weight boundary increments (DMM 113 & 213)', () => {
      // Dimensions ceiling rounding:
      // Rectangular 12.1 in rounds UP to 13 in: 13³ = 2,197 in³ / 139 = 15.8058 lb -> calculated dim weight = 16 lb -> rated 16 lb
      const pRect = piece({ length: 12.1, width: 12.1, height: 12.1, unit: 'in', weightEach: 1, weightUnit: 'lb', shape: 'rectangular' });
      const resRect = calculateBillableWeight([pRect], uspsExpressRule);
      expect(resRect.totalUnroundedDimensional).toBeCloseTo(2197 / 139, 4);
      expect(resRect.totalDimensional).toBe(16);
      expect(resRect.billable).toBe(16);

      // Nonrectangular 14.1 in rounds UP to 15 in: 15³ × 0.785 = 2,649.375 in³ / 139 = 19.0603 lb -> calculated dim weight = 20 lb -> rated 20 lb
      const pNonrect = piece({ length: 14.1, width: 14.1, height: 14.1, unit: 'in', weightEach: 1, weightUnit: 'lb', shape: 'nonrectangular' });
      const resNonrect = calculateBillableWeight([pNonrect], uspsExpressRule);
      expect(resNonrect.totalUnroundedDimensional).toBeCloseTo(2649.375 / 139, 4);
      expect(resNonrect.totalDimensional).toBe(20);
      expect(resNonrect.billable).toBe(20);

      // Lower-weight boundary fixtures (under-threshold parcel: 10 × 10 × 10 = 1,000 in³ <= 1,728 in³):
      // 0.25 lb actual weight -> 0.5 lb rated-weight increment
      const p0_25 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 0.25, weightUnit: 'lb', shape: 'rectangular' });
      const res0_25 = calculateBillableWeight([p0_25], uspsExpressRule);
      expect(res0_25.totalDimensional).toBe(0);
      expect(res0_25.billable).toBe(0.5);

      // 0.50 lb actual weight -> 0.5 lb rated-weight increment
      const p0_50 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 0.50, weightUnit: 'lb', shape: 'rectangular' });
      const res0_50 = calculateBillableWeight([p0_50], uspsExpressRule);
      expect(res0_50.billable).toBe(0.5);

      // A weight just above 0.5 lb (0.51 lb) -> 1.0 lb rated-weight increment
      const p0_51 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 0.51, weightUnit: 'lb', shape: 'rectangular' });
      const res0_51 = calculateBillableWeight([p0_51], uspsExpressRule);
      expect(res0_51.billable).toBe(1.0);

      // Whole-pound boundary: 1.00 lb -> 1.0 lb
      const p1_00 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 1.00, weightUnit: 'lb', shape: 'rectangular' });
      const res1_00 = calculateBillableWeight([p1_00], uspsExpressRule);
      expect(res1_00.billable).toBe(1.0);

      // Just above whole pound: 1.01 lb -> 2.0 lb
      const p1_01 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 1.01, weightUnit: 'lb', shape: 'rectangular' });
      const res1_01 = calculateBillableWeight([p1_01], uspsExpressRule);
      expect(res1_01.billable).toBe(2.0);

      // Dimensional-weight comparison: parcel exceeding threshold (14 × 14 × 14 in = 2,744 in³ > 1,728 in³), actual weight 0.25 lb:
      // Divisor 139: dim weight = 2,744 / 139 = 19.7410 lb -> calculated dim weight = 20 lb -> rated billable = 20 lb (dim weight governs)
      const pThresholdExpress = piece({ length: 14, width: 14, height: 14, unit: 'in', weightEach: 0.25, weightUnit: 'lb', shape: 'rectangular' });
      const resThresholdExpress = calculateBillableWeight([pThresholdExpress], uspsExpressRule);
      expect(resThresholdExpress.totalUnroundedDimensional).toBeCloseTo(2744 / 139, 4);
      expect(resThresholdExpress.totalDimensional).toBe(20);
      expect(resThresholdExpress.billable).toBe(20);
      expect(resThresholdExpress.basisWon).toBe('dimensional');
    });

    it('USPS dimensional weight exceeding 70 lb pricing cap explicitly verifies unrounded quotient, calculated dim weight, and 70 lb rated tier', () => {
      // 30 × 30 × 30 in rectangular, actual weight 15 lb:
      // Raw volume = 27,000 in³ > 1,728 in³.
      // Divisor 139:
      // 1. Unrounded quotient = 27,000 / 139 = 194.2446... lb
      // 2. Calculated dimensional weight = 195 lb (rounded up to next whole pound per USPS DMM 123.1.3.2 / 223.1.4.2)
      // 3. Rated price tier = 70 lb (because dimensional weight exceeds 70 lb while actual weight is eligible)
      const pLarge = piece({ length: 30, width: 30, height: 30, unit: 'in', weightEach: 15, weightUnit: 'lb', shape: 'rectangular' });
      const resLarge = calculateBillableWeight([pLarge], uspsCommercialRule);

      expect(resLarge.totalActual).toBe(15);
      expect(resLarge.totalUnroundedDimensional).toBeCloseTo(27000 / 139, 4);
      expect(resLarge.totalDimensional).toBe(195);
      expect(resLarge.billable).toBe(70);
      expect(resLarge.isOverweight).toBe(false);
      expect(describeBasis(resLarge)).toContain('exceeds the 70 lb maximum pricing tier');
    });

    it('USPS presets do not silently cap overweight physical parcels (> 70 lb actual scale weight)', () => {
      const uspsPresetsToTest = [
        { name: 'Commercial Priority', rule: uspsCommercialRule },
        { name: 'Retail Priority', rule: uspsRetailRule },
        { name: 'Priority Mail Express', rule: uspsExpressRule },
      ];

      for (const { name, rule } of uspsPresetsToTest) {
        // Physical weight 75 lb (> 70 lb service limit):
        // Under-threshold package (10 × 10 × 10 in)
        const pOverweightSmall = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 75, weightUnit: 'lb' });
        const resSmall = calculateBillableWeight([pOverweightSmall], rule);
        expect(resSmall.isOverweight, `${name} small parcel should be flagged overweight`).toBe(true);
        expect(resSmall.billable, `${name} small parcel must NOT be capped at 70 lb`).toBe(75);
        expect(describeBasis(resSmall)).toContain('exceeds the 70 lb service limit');

        // Large package (30 × 30 × 30 in) with physical weight 75 lb:
        // Even though dim weight is 195 lb, physical parcel is overweight
        const pOverweightLarge = piece({ length: 30, width: 30, height: 30, unit: 'in', weightEach: 75, weightUnit: 'lb' });
        const resLarge = calculateBillableWeight([pOverweightLarge], rule);
        expect(resLarge.isOverweight, `${name} large parcel should be flagged overweight`).toBe(true);
        // Must NOT silently cap at 70 lb
        expect(resLarge.billable, `${name} large parcel must NOT be capped at 70 lb`).toBe(195);
        expect(describeBasis(resLarge)).toContain('exceeds the 70 lb service limit');
      }
    });

    it('Non-USPS carriers do not apply the USPS 70 lb weight cap to 75 lb physical parcels', () => {
      const p75 = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 75, weightUnit: 'lb' });
      const upsRes = calculateBillableWeight([p75], upsDailyRule);
      const fedexRes = calculateBillableWeight([p75], fedexDomesticRule);

      expect(upsRes.isOverweight).toBeFalsy();
      expect(upsRes.billable).toBe(75);

      expect(fedexRes.isOverweight).toBeFalsy();
      expect(fedexRes.billable).toBe(75);
    });

    it('FedEx measurement rounding rounds to nearest whole inch per guidance', () => {
      // 10.4 in rounds down to 10 in: 10 × 10 × 10 = 1,000 in³ / 139 = 7.1942 lb -> 8 lb
      const p10_4 = piece({ length: 10.4, width: 10.4, height: 10.4, unit: 'in', weightEach: 2, weightUnit: 'lb' });
      const res10_4 = calculateBillableWeight([p10_4], fedexDomesticRule);
      expect(res10_4.totalUnroundedDimensional).toBeCloseTo(1000 / 139, 4);
      expect(res10_4.totalDimensional).toBe(8);
      expect(res10_4.billable).toBe(8);

      // 10.5 in rounds up to 11 in: 11 × 11 × 11 = 1,331 in³ / 139 = 9.5755 lb -> 10 lb
      const p10_5 = piece({ length: 10.5, width: 10.5, height: 10.5, unit: 'in', weightEach: 2, weightUnit: 'lb' });
      const res10_5 = calculateBillableWeight([p10_5], fedexDomesticRule);
      expect(res10_5.totalUnroundedDimensional).toBeCloseTo(1331 / 139, 4);
      expect(res10_5.totalDimensional).toBe(10);
      expect(res10_5.billable).toBe(10);

      // Mixed: 10.6 (-> 11) × 10.4 (-> 10) × 10.5 (-> 11) = 1,210 in³ / 139 = 8.7050 lb -> 9 lb
      const pMixed = piece({ length: 10.6, width: 10.4, height: 10.5, unit: 'in', weightEach: 2, weightUnit: 'lb' });
      const resMixed = calculateBillableWeight([pMixed], fedexDomesticRule);
      expect(resMixed.totalUnroundedDimensional).toBeCloseTo(1210 / 139, 4);
      expect(resMixed.totalDimensional).toBe(9);
      expect(resMixed.billable).toBe(9);
    });

    it('USPS and UPS dimension rounding rounds fractions UP to whole inch', () => {
      // 10.1 in rounds UP to 11 in: 11 × 11 × 11 = 1,331 in³
      const p10_1 = piece({ length: 10.1, width: 10.1, height: 10.1, unit: 'in', weightEach: 2, weightUnit: 'lb' });
      const res10_1 = calculateBillableWeight([p10_1], upsDailyRule);
      expect(res10_1.totalUnroundedDimensional).toBeCloseTo(1331 / 139, 4);
      expect(res10_1.totalDimensional).toBe(10);
      expect(res10_1.billable).toBe(10);

      // 10.0 in stays 10 in: 10 × 10 × 10 = 1,000 in³
      const p10_0 = piece({ length: 10.0, width: 10.0, height: 10.0, unit: 'in', weightEach: 2, weightUnit: 'lb' });
      const res10_0 = calculateBillableWeight([p10_0], upsDailyRule);
      expect(res10_0.totalUnroundedDimensional).toBeCloseTo(1000 / 139, 4);
      expect(res10_0.totalDimensional).toBe(8);
      expect(res10_0.billable).toBe(8);
    });

    it('Fractional actual weights at rating boundaries are rounded up to whole pounds', () => {
      // Under-threshold parcel (10 × 10 × 10 = 1,000 in³ <= 1,728)
      const p3_0 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 3.0, weightUnit: 'lb' });
      expect(calculateBillableWeight([p3_0], uspsRetailRule).billable).toBe(3);

      const p3_1 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 3.1, weightUnit: 'lb' });
      expect(calculateBillableWeight([p3_1], uspsRetailRule).billable).toBe(4);

      const p3_9 = piece({ length: 10, width: 10, height: 10, unit: 'in', weightEach: 3.9, weightUnit: 'lb' });
      expect(calculateBillableWeight([p3_9], uspsRetailRule).billable).toBe(4);
    });

    it('Dimensional weight rounding just below and above whole-pound boundaries', () => {
      // Package with dimensions yielding exactly 556 in³ / 139 = 4.000 lb
      const pExact = piece({ length: 556, width: 1, height: 1, unit: 'in', weightEach: 1, weightUnit: 'lb' });
      const exactRule: DimRule = { divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', dimensionRounding: 'none', roundDimensionsUp: false, basis: 'piece', weightRounding: 'whole' };
      const resExact = calculateBillableWeight([pExact], exactRule);
      expect(resExact.totalDimensional).toBe(4);
      expect(resExact.billable).toBe(4);

      // Package with dimensions yielding 557 in³ / 139 = 4.00719 lb -> rounds to 5 lb
      const pJustAbove = piece({ length: 557, width: 1, height: 1, unit: 'in', weightEach: 1, weightUnit: 'lb' });
      const resJustAbove = calculateBillableWeight([pJustAbove], exactRule);
      expect(resJustAbove.totalUnroundedDimensional).toBeGreaterThan(4.0);
      expect(resJustAbove.totalDimensional).toBe(5);
      expect(resJustAbove.billable).toBe(5);
    });

    it('UPS Daily Rates (139) vs Retail Rates (166) produce different billable weights', () => {
      // Package: 20 × 16 × 12 in = 3,840 in³, actual weight 15 lb
      const pkg = piece({ length: 20, width: 16, height: 12, unit: 'in', weightEach: 15, weightUnit: 'lb' });

      const dailyRes = calculateBillableWeight([pkg], upsDailyRule);
      const retailRes = calculateBillableWeight([pkg], upsRetailRule);

      // Daily: 3840 / 139 = 27.625899... -> ceil 28 lb
      expect(dailyRes.totalUnroundedDimensional).toBeCloseTo(3840 / 139, 4);
      expect(dailyRes.totalDimensional).toBe(28);
      expect(dailyRes.billable).toBe(28);

      // Retail: 3840 / 166 = 23.13253... -> ceil 24 lb
      expect(retailRes.totalUnroundedDimensional).toBeCloseTo(3840 / 166, 4);
      expect(retailRes.totalDimensional).toBe(24);
      expect(retailRes.billable).toBe(24);

      expect(dailyRes.billable).not.toBe(retailRes.billable);
    });
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
