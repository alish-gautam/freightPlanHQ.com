import { describe, expect, it } from 'vitest';
import { calculators } from './registry';
import { planTrailerFloor } from '../calculations/trailer-floor';
import type { Values, RowValues } from './types';

describe('Calculator Registry & All 14 Specs', () => {
  it('contains exactly 14 canonical calculators', () => {
    expect(calculators).toHaveLength(14);
  });

  const expectedSlugs = [
    'freight-class-calculator',
    'cbm-calculator',
    'pallet-calculator',
    'dimensional-weight-calculator',
    'container-loading-calculator',
    'freight-density-calculator',
    'air-freight-chargeable-weight-calculator',
    'lcl-freight-calculator',
    'pallets-per-container-calculator',
    'loading-meter-calculator',
    'linear-feet-calculator',
    'package-girth-calculator',
    'box-size-calculator',
    'box-volume-calculator',
  ];

  it('contains every required canonical route', () => {
    const slugs = calculators.map((c) => c.slug);
    for (const expected of expectedSlugs) {
      expect(slugs).toContain(expected);
    }
  });

  calculators.forEach((calc) => {
    it(`evaluates ${calc.slug} default inputs successfully`, () => {
      // Extract default values from spec sections
      const defaultValues: Values = {};
      for (const section of calc.spec.sections) {
        for (const field of section.fields) {
          if (field.kind === 'number') {
            defaultValues[field.id] = field.default !== undefined && field.default !== '' ? Number(field.default) : null;
          } else if (field.kind === 'select') {
            defaultValues[field.id] = field.default;
          } else if (field.kind === 'check') {
            defaultValues[field.id] = field.default;
          } else if (field.kind === 'rows') {
            defaultValues[field.id] = field.defaults.map((d) => {
              const row: RowValues = {};
              for (const col of field.columns) {
                row[col.id] = col.kind === 'number' ? Number(d[col.id]) : String(d[col.id]);
              }
              return row;
            });
          }
        }
      }

      const res = calc.spec.compute(defaultValues);
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.headline.value).toBeDefined();
        expect(res.headline.value.length).toBeGreaterThan(0);
        expect(res.interpretation.length).toBeGreaterThan(0);
      }
    });
  });
});

describe('Trailer Floor Planning (Loading Meters & Linear Feet)', () => {
  it('calculates Euro pallets on 2.4m trailer for LDM', () => {
    // 10 Euro pallets (1200x800mm) on 2400mm wide trailer
    const r = planTrailerFloor({
      item: { l: 1200, w: 800, h: 1400 },
      quantity: 10,
      trailerWidth: 2400,
      trailerLength: 13600,
      stackLevels: 1,
      trailerHeight: null,
      rotate: true,
    });

    expect(r.fits).toBe(true);
    expect(r.floorPositions).toBe(10);
    // 10 pallets loaded 2 abreast (800mm across) = 5 rows * 800mm = 4000mm = 4.0 LDM
    expect(r.lengthUsed / 1000).toBeCloseTo(4.0, 1);
  });

  it('calculates GMA pallets on 96" trailer for Linear Feet', () => {
    // 12 GMA pallets (48x40 in = 1219x1016 mm) on 96 in (2438 mm) wide trailer
    const r = planTrailerFloor({
      item: { l: 1219, w: 1016, h: 1219 },
      quantity: 12,
      trailerWidth: 2438,
      trailerLength: 16154, // 53 ft
      stackLevels: 1,
      trailerHeight: null,
      rotate: true,
    });

    expect(r.fits).toBe(true);
    expect(r.floorPositions).toBe(12);
    // 2 pallets fit across width (2 * 1219 = 2438 mm or 2 * 1016 = 2032 mm)
    // Converted to linear feet, 6 rows * 40 in = 240 in = 20 ft
    const linearFeet = (r.lengthUsed / 25.4) / 12;
    expect(linearFeet).toBeCloseTo(20.0, 1);
  });
});

describe('Carrier Rules & Preset Precision Tests', () => {
  it('evaluates package-girth with carrier-mapped thresholds', () => {
    const girthCalc = calculators.find((c) => c.slug === 'package-girth-calculator')!;
    // Package: 40 × 30 × 20 in -> Length 40, Girth 2×(30+20)=100, L+G = 140
    // Test USPS max 130 -> should exceed 130
    const r1 = girthCalc.spec.compute({
      unit: 'in',
      dim1: 40,
      dim2: 30,
      dim3: 20,
      thresholdPreset: 'usps_max_130',
    });
    expect(r1.ok).toBe(true);
    if (r1.ok) {
      expect(r1.warnings).toBeDefined();
      expect(r1.warnings![0]).toContain('nonmailable');
    }

    // Test UPS/FedEx max length 108 -> length is 40 <= 108 -> within
    const r2 = girthCalc.spec.compute({
      unit: 'in',
      dim1: 40,
      dim2: 30,
      dim3: 20,
      thresholdPreset: 'ups_fedex_len_108',
    });
    expect(r2.ok).toBe(true);
    if (r2.ok) {
      expect(r2.warnings).toBeUndefined();
    }
  });

  it('box-size calculator formats DIM weight in lbs when unit is in', () => {
    const boxCalc = calculators.find((c) => c.slug === 'box-size-calculator')!;
    const r = boxCalc.spec.compute({
      unit: 'in',
      pl: 10,
      pw: 8,
      ph: 6,
      qty: 2,
      padding: 0.5,
      board: 0.25,
      allowRotation: true,
      divider: 0,
    });
    expect(r.ok).toBe(true);
    if (r.ok) {
      const dimStat = r.stats.find((s) => s.label === 'Estimated dimensional weight');
      expect(dimStat?.value).toContain('lb');
      expect(dimStat?.value).toContain('139 in³/lb');
    }
  });
});
