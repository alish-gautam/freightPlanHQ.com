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

describe('Calculator Boundary & Edge-Case QA Suite (Phase 6)', () => {
  const freightClassCalc = calculators.find((c) => c.slug === 'freight-class-calculator')!;
  const dimWeightCalc = calculators.find((c) => c.slug === 'dimensional-weight-calculator')!;
  const palletCalc = calculators.find((c) => c.slug === 'pallet-calculator')!;
  const containerCalc = calculators.find((c) => c.slug === 'container-loading-calculator')!;

  describe('Freight Class Calculator Boundaries', () => {
    it('rejects zero or negative dimensions and weights', () => {
      const resZero = freightClassCalc.spec.compute({
        unit: 'in',
        weightUnit: 'lb',
        palletTare: 0,
        items: [{ l: 0, w: 40, h: 48, qty: 1, weight: 500 }],
      });
      expect(resZero.ok).toBe(false);

      const resNeg = freightClassCalc.spec.compute({
        unit: 'in',
        weightUnit: 'lb',
        palletTare: 0,
        items: [{ l: 48, w: -40, h: 48, qty: 1, weight: 500 }],
      });
      expect(resNeg.ok).toBe(false);
    });

    it('handles decimal dimensions and fractional weights precisely', () => {
      const res = freightClassCalc.spec.compute({
        unit: 'in',
        weightUnit: 'lb',
        palletTare: 35.5,
        items: [{ l: 47.75, w: 39.5, h: 52.25, qty: 1, weight: 642.8 }],
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.headline.value).toBeDefined();
      }
    });

    it('handles extreme high density without overflow (solid lead/iron)', () => {
      const res = freightClassCalc.spec.compute({
        unit: 'in',
        weightUnit: 'lb',
        palletTare: 40,
        items: [{ l: 24, w: 24, h: 24, qty: 1, weight: 5000 }], // ~625 PCF -> Class 50
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.headline.value).toContain('50');
      }
    });
  });

  describe('Dimensional Weight Calculator Boundaries', () => {
    it('rejects empty pieces array', () => {
      const res = dimWeightCalc.spec.compute({
        preset: 'ups-daily',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [],
      });
      expect(res.ok).toBe(false);
    });

    it('rejects negative or zero dimensions', () => {
      const res = dimWeightCalc.spec.compute({
        preset: 'ups-daily',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: -10, w: 10, h: 10, unit: 'in', qty: 1, weight: 5 }],
      });
      expect(res.ok).toBe(false);
    });

    it('processes multi-row decimal items accurately', () => {
      const res = dimWeightCalc.spec.compute({
        preset: 'ups-daily',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        roundDims: false,
        weightRounding: 'none',
        basis: 'shipment',
        items: [
          { l: 12.5, w: 10.25, h: 8.5, unit: 'in', qty: 2, weight: 4.5, shape: 'rectangular' },
          { l: 20.0, w: 15.5, h: 12.0, unit: 'in', qty: 1, weight: 12.0, shape: 'rectangular' },
        ],
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.stats.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Pallet Calculator Boundaries', () => {
    it('rejects invalid or zero carton dimensions', () => {
      const res = palletCalc.spec.compute({
        unit: 'mm',
        cl: 0,
        cw: 300,
        ch: 200,
        weight: 10,
        weightUnit: 'kg',
        qty: 100,
        palletPreset: 'euro',
        deck: 144,
        maxH: 1800,
        maxPayload: 1000,
        tare: 25,
      });
      expect(res.ok).toBe(false);
    });

    it('handles cartons that exceed pallet deck without overhang permission', () => {
      // Carton 2000 × 1500 × 1500 mm on a 1200 × 800 mm pallet -> cannot fit anywhere
      const res = palletCalc.spec.compute({
        unit: 'mm',
        cl: 2000,
        cw: 1500,
        ch: 1500,
        cwt: 100,
        weightUnit: 'kg',
        qty: 10,
        palletPreset: 'euro',
        palletL: 1200,
        palletW: 800,
        deck: 144,
        maxH: 1800,
        allowLOverhang: false,
        allowWOverhang: false,
        maxLOverhang: 0,
        maxWOverhang: 0,
        tare: 25,
      });
      // When carton does not fit, spec returns ok: false with explanatory errors
      expect(res.ok).toBe(false);
      if (!res.ok) {
        expect(res.errors.length).toBeGreaterThan(0);
      }
    });
  });

  describe('Container Loading Calculator Boundaries', () => {
    it('rejects zero or negative carton dimensions', () => {
      const res = containerCalc.spec.compute({
        dimUnit: 'mm',
        contL: 5896,
        contW: 2350,
        contH: 2393,
        cl: -100,
        cw: 200,
        ch: 300,
        cwt: 10,
        qty: 10,
        weightUnit: 'kg',
      });
      expect(res.ok).toBe(false);
    });

    it('calculates realistic multi-tier block packing inside a 20ft container', () => {
      const res = containerCalc.spec.compute({
        dimUnit: 'mm',
        preset: '20ft',
        contL: 5896,
        contW: 2350,
        contH: 2393,
        payload: 28200,
        cl: 400,
        cw: 300,
        ch: 250,
        cwt: 15,
        qty: 1500,
        weightUnit: 'kg',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        const countStat = res.stats.find((s) => s.label.toLowerCase().includes('pieces loaded') || s.label.toLowerCase().includes('recommended capacity'));
        expect(countStat).toBeDefined();
        const firstNum = countStat?.value.match(/^([\d,]+)/)?.[1].replace(/,/g, '');
        expect(Number(firstNum)).toBeGreaterThan(500);
      }
    });
  });

  describe('Dimensional Weight Calculator Spec Integration', () => {
    const dimCalc = calculators.find((c) => c.slug === 'dimensional-weight-calculator')!;

    it('evaluates USPS Retail Priority under-threshold parcel with clear non-applicability message', () => {
      const res = dimCalc.spec.compute({
        preset: 'usps-retail-priority',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 12, w: 12, h: 12, unit: 'in', qty: 1, weight: 5, shape: 'rectangular' }],
        roundDims: 'up',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        expect(res.headline.value).toBe('5.00 lb');
        expect(res.stats.find((s) => s.label === 'Actual weight')?.value).toBe('5.00 lb');
        expect(res.stats.find((s) => s.label === 'Dimensional weight')?.value).toBe('0.00 lb');
        expect(res.interpretation.some((txt) => txt.includes('does not exceed 1,728 in³') && txt.includes('actual scale weight'))).toBe(true);
      }
    });

    it('evaluates USPS nonrectangular parcel where raw > 1,728 but adjusted <= 1,728 correctly', () => {
      const res = dimCalc.spec.compute({
        preset: 'usps-commercial-priority',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 15, w: 12, h: 10, unit: 'in', qty: 1, weight: 6.5, shape: 'nonrectangular' }],
        roundDims: 'up',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(res.ok).toBe(true);
      if (res.ok) {
        // Actual 6.5 lb rounded up to whole lb = 7.00 lb
        expect(res.headline.value).toBe('7.00 lb');
        expect(res.stats.find((s) => s.label === 'Dimensional weight')?.value).toBe('0.00 lb');
        expect(res.interpretation.some((txt) => txt.includes('does not exceed 1,728 in³'))).toBe(true);
      }
    });

    it('evaluates FedEx domestic parcel with nearest whole-inch measurement rounding', () => {
      const res10_4 = dimCalc.spec.compute({
        preset: 'fedex-domestic',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 10.4, w: 10.4, h: 10.4, unit: 'in', qty: 1, weight: 2, shape: 'rectangular' }],
        roundDims: 'nearest',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(res10_4.ok).toBe(true);
      if (res10_4.ok) {
        // 10 × 10 × 10 = 1,000 / 139 = 7.1942 -> 8.00 lb
        expect(res10_4.headline.value).toBe('8.00 lb');
      }

        const res10_5 = dimCalc.spec.compute({
        preset: 'fedex-domestic',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 10.5, w: 10.5, h: 10.5, unit: 'in', qty: 1, weight: 2, shape: 'rectangular' }],
        roundDims: 'nearest',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(res10_5.ok).toBe(true);
      if (res10_5.ok) {
        // 11 × 11 × 11 = 1,331 / 139 = 9.5755 -> 10.00 lb
        expect(res10_5.headline.value).toBe('10.00 lb');
      }
    });

    it('evaluates USPS Commercial Priority rectangular vs nonrectangular shape rounding at spec level', () => {
      // Nonrectangular 14.1 in: rounds off to 14 in (DMM 223.1.4.3)
      // Adjusted: 14³ × 0.785 = 2,154.04 in³ > 1,728 in³; divisor 166 -> 2,154.04 / 166 = 12.9761 lb -> 13.00 lb rated
      const resNonrect = dimCalc.spec.compute({
        preset: 'usps-commercial-priority',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 14.1, w: 14.1, h: 14.1, unit: 'in', qty: 1, weight: 2, shape: 'nonrectangular' }],
        roundDims: 'up',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(resNonrect.ok).toBe(true);
      if (resNonrect.ok) {
        expect(resNonrect.headline.value).toBe('13.00 lb');
        expect(resNonrect.stats.find((s) => s.label === 'Dimensional weight')?.value).toBe('13.00 lb');
        expect(resNonrect.stats.find((s) => s.label === 'Dimensional weight')?.hint).toContain('12.98 lb');
      }

      // Rectangular 14.1 in: rounds UP to 15 in (DMM 223.1.4.2)
      // Raw: 15³ = 3,375 in³ > 1,728 in³; divisor 139 -> 3,375 / 139 = 24.2806 lb -> calculated dim weight = 25.00 lb -> 25.00 lb rated
      const resRect = dimCalc.spec.compute({
        preset: 'usps-commercial-priority',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 14.1, w: 14.1, h: 14.1, unit: 'in', qty: 1, weight: 2, shape: 'rectangular' }],
        roundDims: 'up',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(resRect.ok).toBe(true);
      if (resRect.ok) {
        expect(resRect.headline.value).toBe('25.00 lb');
        expect(resRect.stats.find((s) => s.label === 'Dimensional weight')?.value).toBe('25.00 lb');
        expect(resRect.stats.find((s) => s.label === 'Dimensional weight')?.hint).toContain('24.28 lb');
      }
    });

    it('evaluates USPS Priority Mail Express lower-weight boundary increments at spec level', () => {
      // 0.25 lb actual weight on under-threshold piece (10 × 10 × 10 = 1,000 in³) -> 0.50 lb rated
      const res0_25 = dimCalc.spec.compute({
        preset: 'usps-priority-express',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 10, w: 10, h: 10, unit: 'in', qty: 1, weight: 0.25, shape: 'rectangular' }],
        roundDims: 'up',
        weightRounding: 'half-then-whole',
        basis: 'piece',
      });
      expect(res0_25.ok).toBe(true);
      if (res0_25.ok) {
        expect(res0_25.headline.value).toBe('0.50 lb');
        expect(res0_25.stats.find((s) => s.label === 'Actual weight')?.value).toBe('0.25 lb');
        expect(res0_25.stats.find((s) => s.label === 'Dimensional weight')?.value).toBe('0.00 lb');
      }

      // 0.51 lb actual weight -> 1.00 lb rated
      const res0_51 = dimCalc.spec.compute({
        preset: 'usps-priority-express',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 10, w: 10, h: 10, unit: 'in', qty: 1, weight: 0.51, shape: 'rectangular' }],
        roundDims: 'up',
        weightRounding: 'half-then-whole',
        basis: 'piece',
      });
      expect(res0_51.ok).toBe(true);
      if (res0_51.ok) {
        expect(res0_51.headline.value).toBe('1.00 lb');
      }
    });

    it('evaluates USPS 70 lb pricing tier cap and separates unrounded quotient, calculated dim weight, and billable weight at spec level', () => {
      // 30 × 30 × 30 in: unrounded quotient = 194.24 lb, calculated dim weight = 195.00 lb, rated billable capped at 70 lb
      const res70 = dimCalc.spec.compute({
        preset: 'usps-commercial-priority',
        divisor: 139,
        divisorUnit: 'in3lb',
        weightUnit: 'lb',
        items: [{ l: 30, w: 30, h: 30, unit: 'in', qty: 1, weight: 15, shape: 'rectangular' }],
        roundDims: 'up',
        weightRounding: 'whole',
        basis: 'piece',
      });
      expect(res70.ok).toBe(true);
      if (res70.ok) {
        expect(res70.headline.value).toBe('70.00 lb');
        expect(res70.stats.find((s) => s.label === 'Actual weight')?.value).toBe('15.00 lb');
        // Calculated dimensional weight rounded up to whole pound per DMM standards: 195.00 lb
        expect(res70.stats.find((s) => s.label === 'Dimensional weight')?.value).toBe('195.00 lb');
        // Unrounded quotient retained separately in hint
        expect(res70.stats.find((s) => s.label === 'Dimensional weight')?.hint).toContain('Unrounded quotient: 194.24 lb');
        expect(res70.stats.find((s) => s.label === 'Billable weight')?.value).toBe('70.00 lb');
        expect(res70.interpretation.some((txt) => txt.includes('70 lb USPS pricing cap'))).toBe(true);
        // Table columns and row values verify all three values
        const table = res70.tables?.[0];
        expect(table?.head).toContain('Unrounded Quotient');
        expect(table?.head).toContain('Calculated Dimensional');
        expect(table?.head).toContain('Rated Billable');
        expect(table?.rows[0]).toEqual(['Row 1', '1', '15.00', '194.24', '195.00', '70.00', 'Dimensional weight']);
      }
    });

    it('evaluates service-eligibility warning when actual scale weight exceeds 70 lb for all USPS presets', () => {
      const presets = ['usps-commercial-priority', 'usps-retail-priority', 'usps-priority-express'];

      for (const preset of presets) {
        // Physical weight 75 lb:
        const resOverweight = dimCalc.spec.compute({
          preset,
          divisor: 139,
          divisorUnit: 'in3lb',
          weightUnit: 'lb',
          items: [{ l: 12, w: 12, h: 12, unit: 'in', qty: 1, weight: 75, shape: 'rectangular' }],
          roundDims: 'up',
          weightRounding: preset === 'usps-priority-express' ? 'half-then-whole' : 'whole',
          basis: 'piece',
        });

        expect(resOverweight.ok).toBe(true);
        if (resOverweight.ok) {
          // Must NOT silently cap at 70 lb
          expect(resOverweight.headline.value).toBe('75.00 lb');
          expect(resOverweight.headline.sub).toContain('Ineligible');
          expect(resOverweight.warnings?.some((w) => w.includes('Service ineligibility warning') && w.includes('70 lb'))).toBe(true);
          expect(resOverweight.interpretation.some((i) => i.includes('ineligible') || i.includes('exceeds'))).toBe(true);
        }
      }
    });
  });
});
