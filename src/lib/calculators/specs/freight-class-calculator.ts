import { classLabel, fixed, fmt } from '../../formatting';
import { DENSITY_BANDS, estimateFreightClass } from '../../standards/freight-class';
import { calculateCbm } from '../../calculations/volume';
import { Checker } from '../../validation';
import { M3_PER, KG_PER } from '../../units';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, lengthUnit, num, rows, weightUnit } from './shared';

const bandText = (min: number, max: number) => (Number.isFinite(max) ? (min === 0 ? `less than ${max}` : `${min} to <${max}`) : `${min} or more`);

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Shipment',
      description: 'Enter the outer dimensions of the freight as it will actually ship (for example, the loaded pallet).',
      fields: [
        { kind: 'select', id: 'weightUnit', label: 'Weight unit', options: WEIGHT_OPTIONS.filter((o) => o.value === 'lb' || o.value === 'kg'), default: 'lb' },
        {
          kind: 'rows',
          id: 'items',
          label: 'Handling units',
          itemLabel: 'Handling unit',
          addLabel: 'Add another handling unit',
          max: 30,
          help: 'One row per identical handling unit (pallet, crate or carton group).',
          columns: [
            { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: 48 },
            { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: 40 },
            { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: 48 },
            { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'in' },
            { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: 2, min: 1 },
            { kind: 'number', id: 'weight', label: 'Weight of one unit', unitFrom: 'weightUnit', default: 600 },
          ],
          defaults: [{ l: 48, w: 40, h: 48, unit: 'in', qty: 2, weight: 600 }],
        },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const wu = weightUnit(v.weightUnit, 'lb');
    const list = rows(v.items);
    if (list.length === 0) return fail(['Add at least one handling unit.']);
    const parsed = list.map((r, i) => {
      const n = `Handling unit ${i + 1}`;
      const ok = [c.positive(num(r.l), `${n} length`), c.positive(num(r.w), `${n} width`), c.positive(num(r.h), `${n} height`), c.integerPositive(num(r.qty), `${n} quantity`), c.positive(num(r.weight), `${n} weight`)].every(Boolean);
      return ok ? { length: num(r.l)!, width: num(r.w)!, height: num(r.h)!, quantity: num(r.qty)!, unit: lengthUnit(r.unit, 'in'), weightEach: num(r.weight)!, weightUnit: wu } : null;
    });
    if (!c.ok) return fail(c.issues);
    const res = calculateCbm(parsed.filter((p) => p !== null) as NonNullable<(typeof parsed)[number]>[]);
    const totalFt3 = res.totalCbm / M3_PER.ft3;
    const totalLb = res.totalWeightKg! / KG_PER.lb;
    const pcf = res.densityPcf!;
    const { band, freightClass } = estimateFreightClass(pcf);
    const idx = DENSITY_BANDS.indexOf(band);
    const lower = idx < DENSITY_BANDS.length - 1 ? DENSITY_BANDS[idx + 1] : null;
    const higher = idx > 0 ? DENSITY_BANDS[idx - 1] : null;
    const interp: string[] = [
      `At ${fmt(pcf, 'density')} lb/ft³, this freight falls in the ${bandText(band.min, band.max)} lb/ft³ band, which maps to class ${classLabel(freightClass)} in the density structure used here.`,
    ];
    if (lower) {
      const needLb = Math.max(0, lower.min * totalFt3 - totalLb);
      interp.push(
        `The next lower-numbered class (${classLabel(lower.freightClass)}) starts at ${lower.min} lb/ft³. On the same volume that would need about ${fixed(needLb, 0)} lb more total weight, or less volume at the same weight.`,
      );
    }
    if (higher) interp.push(`The next higher-numbered class (${classLabel(higher.freightClass)}) applies below ${band.min} lb/ft³.`);
    interp.push('This is a density-based estimate, not an official NMFC commodity lookup. The class on your bill of lading depends on the NMFC item and any handling, stowability or liability rules.');
    return {
      ok: true,
      headline: { label: 'Estimated density-based freight class', value: classLabel(freightClass), sub: `${fmt(pcf, 'density')} lb/ft³ · ${bandText(band.min, band.max)} lb/ft³ band` },
      stats: [
        { label: 'Density', value: `${fmt(pcf, 'density')} lb/ft³`, hint: `${fmt(res.densityKgM3!, 'density')} kg/m³` },
        { label: 'Total volume', value: `${fmt(totalFt3, 'volume')} ft³`, hint: `${fmt(res.totalCbm, 'cbm')} m³` },
        { label: 'Total weight', value: `${fmt(totalLb, 'weight')} lb`, hint: `${fmt(res.totalWeightKg!, 'weight')} kg` },
        { label: 'Handling units', value: fmt(res.totalPieces, 'count') },
      ],
      interpretation: interp,
      assumptions: [
        'Density = total weight ÷ total volume, using the outer dimensions you entered.',
        'Classes follow the 13-sub density structure (see the Freight Class Chart guide). Boundaries: lower value included, upper value excluded.',
        'Handling, stowability and liability characteristics are not evaluated.',
      ],
      links: [
        { href: '/guides/how-to-calculate-freight-class/', label: 'How freight class is calculated' },
        { href: '/guides/nmfc-density-class-changes/', label: 'NMFC density class changes' },
      ],
    };
  },
};
export default spec;
