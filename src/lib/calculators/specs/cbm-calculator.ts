import { fixed, fmt } from '../../formatting';
import { calculateCbm } from '../../calculations/volume';
import { Checker } from '../../validation';
import { M3_PER } from '../../units';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, lengthUnit, num, rows, str, weightUnit } from './shared';

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Cargo',
      fields: [
        {
          kind: 'select',
          id: 'basis',
          label: 'Measurement basis',
          options: [
            { value: 'packed', label: 'Packed carton or pallet (outer shipping dimensions)' },
            { value: 'product', label: 'Product only (without packaging)' },
          ],
          default: 'packed',
          help: 'Carriers measure what they handle. Use outer packed dimensions for shipping volume.',
        },
        { kind: 'select', id: 'weightUnit', label: 'Weight unit (used for optional weights)', options: WEIGHT_OPTIONS, default: 'kg' },
        {
          kind: 'rows',
          id: 'items',
          label: 'Cargo rows',
          itemLabel: 'Cargo row',
          addLabel: 'Add another SKU or carton size',
          max: 50,
          help: 'Add a weight to every row to also get total weight and shipment density.',
          columns: [
            { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: 60 },
            { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: 40 },
            { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: 40 },
            { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'cm' },
            { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: 120, min: 1 },
            { kind: 'number', id: 'weight', label: 'Gross weight of one piece', unitFrom: 'weightUnit', optional: true, default: 18 },
          ],
          defaults: [{ l: 60, w: 40, h: 40, unit: 'cm', qty: 120, weight: 18 }],
        },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const list = rows(v.items);
    if (list.length === 0) return fail(['Add at least one cargo row.']);
    const wu = weightUnit(v.weightUnit, 'kg');
    const parsed = list.map((r, i) => {
      const n = `Row ${i + 1}`;
      const ok = [c.positive(num(r.l), `${n} length`), c.positive(num(r.w), `${n} width`), c.positive(num(r.h), `${n} height`), c.integerPositive(num(r.qty), `${n} quantity`)].every(Boolean);
      const wRaw = num(r.weight);
      if (wRaw !== null) c.positive(wRaw, `${n} weight`);
      return ok ? { length: num(r.l)!, width: num(r.w)!, height: num(r.h)!, quantity: num(r.qty)!, unit: lengthUnit(r.unit), weightEach: wRaw, weightUnit: wu } : null;
    });
    if (!c.ok) return fail(c.issues);
    const res = calculateCbm(parsed as NonNullable<(typeof parsed)[number]>[]);
    const stats = [
      { label: 'Total volume', value: `${fmt(res.totalCbm, 'cbm')} m³`, hint: `${fmt(res.totalCbm / M3_PER.ft3, 'volume')} ft³` },
      { label: 'Total pieces', value: fmt(res.totalPieces, 'count') },
    ];
    const packed = str(v.basis) !== 'product';
    const interp: string[] = [`${fmt(res.totalPieces, 'count')} pieces occupy ${fmt(res.totalCbm, 'cbm')} m³ in total, measured on ${packed ? 'packed outer dimensions' : 'product dimensions'}.`];
    const warnings: string[] = [];
    if (!packed) warnings.push('You selected product-only dimensions. Packaging, pallets and dunnage usually add volume, so this can understate the shipping volume.');
    if (res.totalWeightKg !== null) {
      stats.push({ label: 'Total gross weight', value: `${fmt(res.totalWeightKg, 'weight')} kg` });
      stats.push({ label: 'Shipment density', value: `${fmt(res.densityKgM3!, 'density')} kg/m³`, hint: `${fmt(res.densityPcf!, 'density')} lb/ft³` });
      interp.push(`Total gross weight is ${fmt(res.totalWeightKg, 'weight')} kg, so the shipment density is ${fmt(res.densityKgM3!, 'density')} kg/m³.`);
    } else if (res.rows.some((r) => r.weightKg !== null)) {
      warnings.push('Some rows have a weight and some do not, so total weight and density are not shown. Add a weight to every row.');
    }
    return {
      ok: true,
      headline: { label: 'Total shipment volume', value: `${fmt(res.totalCbm, 'cbm')} m³`, sub: `${fixed(res.totalCbm, 3)} CBM` },
      stats,
      interpretation: interp,
      warnings,
      tables: [
        {
          caption: 'Volume by row',
          head: ['Row', 'CBM per piece', 'Pieces', 'CBM total'],
          rows: res.rows.map((r, i) => [`Row ${i + 1}`, fixed(r.cbmEach, 4), fmt(r.pieces, 'count'), fixed(r.cbm, 3)]),
        },
      ],
      assumptions: ['CBM = length × width × height × quantity, after converting every dimension to metres.'],
      links: [
        { href: '/freight-density-calculator/', label: 'Turn volume and weight into density' },
        { href: '/lcl-freight-calculator/', label: 'Use this volume for an LCL estimate' },
        { href: '/air-freight-chargeable-weight-calculator/', label: 'Check air chargeable weight' },
      ],
    };
  },
};
export default spec;
