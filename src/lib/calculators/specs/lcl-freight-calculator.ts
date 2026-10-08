import { fixed, fmt } from '../../formatting';
import { calculateLcl } from '../../calculations/lcl';
import { calculateCbm } from '../../calculations/volume';
import { Checker } from '../../validation';
import { toKg } from '../../units';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, lengthUnit, num, rows, weightUnit } from './shared';

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Cargo',
      fields: [
        { kind: 'select', id: 'weightUnit', label: 'Weight unit', options: WEIGHT_OPTIONS, default: 'kg' },
        {
          kind: 'rows',
          id: 'items',
          label: 'Cargo rows',
          itemLabel: 'Cargo row',
          addLabel: 'Add another cargo row',
          max: 50,
          help: 'Enter dimensions to calculate CBM, or enter a known total CBM for the row (this overrides the dimensions).',
          columns: [
            { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: 60, optional: true },
            { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: 40, optional: true },
            { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: 40, optional: true },
            { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'cm' },
            { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: 200, min: 1 },
            { kind: 'number', id: 'cbm', label: 'Known total CBM for this row', suffix: 'm³', optional: true },
            { kind: 'number', id: 'weight', label: 'Gross weight of one piece', unitFrom: 'weightUnit', default: 12 },
          ],
          defaults: [{ l: 60, w: 40, h: 40, unit: 'cm', qty: 200, weight: 12 }],
        },
      ],
    },
    {
      advanced: true,
      title: 'Commercial inputs (your own figures)',
      description: 'Nothing here is assumed. Enter only values from your quote. Leave blank to see W/M only.',
      fields: [
        { kind: 'number', id: 'rate', label: 'Rate per W/M (your currency)', optional: true, suffix: 'per W/M' },
        { kind: 'number', id: 'min', label: 'Minimum chargeable W/M', optional: true, suffix: 'W/M' },
        { kind: 'number', id: 'fees', label: 'Fixed fees total', optional: true, suffix: 'your currency' },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const wu = weightUnit(v.weightUnit);
    const list = rows(v.items);
    if (!list.length) return fail(['Add at least one cargo row.']);
    const parsed = list.map((r, i) => {
      const n = `Row ${i + 1}`;
      const qty = num(r.qty);
      c.integerPositive(qty, `${n} quantity`);
      const w = num(r.weight);
      c.positive(w, `${n} weight`);
      const known = num(r.cbm);
      let cbm: number | null = null;
      if (known !== null) {
        if (c.positive(known, `${n} CBM`)) cbm = known;
      } else {
        const okDims = [c.positive(num(r.l), `${n} length (or enter a known CBM)`), c.positive(num(r.w), `${n} width`), c.positive(num(r.h), `${n} height`)].every(Boolean);
        if (okDims && qty !== null) cbm = calculateCbm([{ length: num(r.l)!, width: num(r.w)!, height: num(r.h)!, quantity: qty, unit: lengthUnit(r.unit) }]).totalCbm;
      }
      return cbm !== null && w !== null && qty !== null ? { cbm, weightKg: toKg(w, wu) * qty } : null;
    });
    const rate = num(v.rate);
    const min = num(v.min);
    const fees = num(v.fees);
    if (rate !== null) c.nonNegative(rate, 'Rate');
    if (min !== null) c.nonNegative(min, 'Minimum W/M');
    if (fees !== null) c.nonNegative(fees, 'Fixed fees');
    if (!c.ok) return fail(c.issues);
    const res = calculateLcl(parsed as { cbm: number; weightKg: number }[], { rate, minimumWm: min, fixedFees: fees });
    const basisText = { measure: 'Measure (CBM) is greater than weight in tonnes, so volume sets the W/M.', weight: 'Weight in tonnes is greater than CBM, so weight sets the W/M.', equal: 'CBM and weight in tonnes are equal.' }[res.basis];
    const interp = [
      `${fmt(res.totalCbm, 'cbm')} m³ versus ${fmt(res.weightTonnes, 'cbm')} tonnes. ${basisText}`,
      res.minimumApplied ? `Your minimum of ${fixed(min!, 2)} W/M is higher than the shipment W/M, so the minimum applies.` : '',
      res.baseFreight !== null ? `Base freight = ${fixed(res.chargeableWm, 3)} W/M × ${fixed(rate!, 2)} = ${fixed(res.baseFreight, 2)}.` : 'Enter a rate in Advanced options to see base freight. No rate is assumed.',
    ].filter(Boolean);
    const stats = [
      { label: 'Total CBM', value: `${fmt(res.totalCbm, 'cbm')} m³` },
      { label: 'Total weight', value: `${fmt(res.totalWeightKg, 'weight')} kg`, hint: `${fmt(res.weightTonnes, 'cbm')} tonnes` },
      { label: 'Measure vs weight', value: res.basis === 'equal' ? 'Equal' : res.basis === 'measure' ? 'Measure (CBM)' : 'Weight (tonnes)' },
      { label: 'Chargeable W/M', value: `${fmt(res.chargeableWm, 'cbm')} W/M` },
    ];
    if (res.baseFreight !== null) stats.push({ label: 'Base freight (your rate)', value: fixed(res.baseFreight, 2) });
    if (res.total !== null && res.fixedFees !== null) stats.push({ label: 'Base freight + your fixed fees', value: fixed(res.total, 2) });
    return {
      ok: true,
      headline: { label: 'Chargeable W/M (planning)', value: `${fmt(res.chargeableWm, 'cbm')} W/M`, sub: res.basis === 'equal' ? 'CBM = tonnes' : res.basis === 'measure' ? 'Measure basis' : 'Weight basis' },
      stats,
      interpretation: interp,
      warnings: ['This is a planning estimate and does not include automatically assumed carrier fees or surcharges.'],
      assumptions: ['W/M = the greater of CBM and weight in tonnes (kg ÷ 1,000). Rate, minimum and fees are only used if you enter them.', 'Rating basis, minimums and charges depend on the carrier or consolidator.'],
      links: [
        { href: '/guides/lcl-weight-or-measure/', label: 'How weight or measure works' },
        { href: '/cbm-calculator/', label: 'Calculate CBM for more cargo' },
      ],
    };
  },
};
export default spec;
