import { classLabel, fmt } from '../../formatting';
import { calculateCbm, densityFrom, kgM3ToPcf, pcfToKgM3 } from '../../calculations/volume';
import { Checker } from '../../validation';
import { estimateFreightClass } from '../../standards/freight-class';
import { toKg, toM3, M3_PER, KG_PER, type VolumeUnit } from '../../units';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, lengthUnit, num, rows, str, weightUnit } from './shared';

const VOL_OPTIONS = [
  { value: 'm3', label: 'm³' },
  { value: 'ft3', label: 'ft³' },
  { value: 'litre', label: 'litres' },
  { value: 'cm3', label: 'cm³' },
  { value: 'in3', label: 'in³' },
];

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Shipment basis',
      fields: [
        {
          kind: 'select',
          id: 'mode',
          label: 'What do you know?',
          options: [
            { value: 'wv', label: 'Total weight and total volume' },
            { value: 'dims', label: 'Dimensions and weight per piece' },
          ],
          default: 'wv',
          help: 'Density depends on the weight and volume actually used for the shipment. Use the same basis a carrier would measure.',
        },
        { kind: 'select', id: 'weightUnit', label: 'Weight unit', options: WEIGHT_OPTIONS, default: 'kg' },
        { kind: 'number', id: 'totalWeight', label: 'Total weight', unitFrom: 'weightUnit', default: 1200, showIf: { field: 'mode', equals: 'wv' } },
        { kind: 'select', id: 'volUnit', label: 'Volume unit', options: VOL_OPTIONS, default: 'm3', showIf: { field: 'mode', equals: 'wv' } },
        { kind: 'number', id: 'totalVolume', label: 'Total volume', unitFrom: 'volUnit', default: 6, showIf: { field: 'mode', equals: 'wv' } },
        {
          kind: 'rows',
          id: 'items',
          label: 'Pieces',
          itemLabel: 'Piece group',
          addLabel: 'Add another piece group',
          max: 30,
          showIf: { field: 'mode', equals: 'dims' },
          columns: [
            { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: 120 },
            { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: 100 },
            { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: 120 },
            { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'cm' },
            { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: 1, min: 1 },
            { kind: 'number', id: 'weight', label: 'Weight of one piece', unitFrom: 'weightUnit', default: 600 },
          ],
          defaults: [{ l: 120, w: 100, h: 120, unit: 'cm', qty: 1, weight: 600 }],
        },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const wu = weightUnit(v.weightUnit);
    let kg: number;
    let m3: number;
    if (str(v.mode) === 'dims') {
      const list = rows(v.items);
      if (!list.length) return fail(['Add at least one piece group.']);
      const parsed = list.map((r, i) => {
        const n = `Piece group ${i + 1}`;
        const ok = [c.positive(num(r.l), `${n} length`), c.positive(num(r.w), `${n} width`), c.positive(num(r.h), `${n} height`), c.integerPositive(num(r.qty), `${n} quantity`), c.positive(num(r.weight), `${n} weight`)].every(Boolean);
        return ok ? { length: num(r.l)!, width: num(r.w)!, height: num(r.h)!, quantity: num(r.qty)!, unit: lengthUnit(r.unit), weightEach: num(r.weight)!, weightUnit: wu } : null;
      });
      if (!c.ok) return fail(c.issues);
      const res = calculateCbm(parsed as NonNullable<(typeof parsed)[number]>[]);
      kg = res.totalWeightKg!;
      m3 = res.totalCbm;
    } else {
      const w = num(v.totalWeight);
      const vol = num(v.totalVolume);
      c.positive(w, 'Total weight');
      c.positive(vol, 'Total volume');
      if (!c.ok) return fail(c.issues);
      kg = toKg(w!, wu);
      m3 = toM3(vol!, str(v.volUnit, 'm3') as VolumeUnit);
    }
    const d = densityFrom(kg, m3);
    const cls = estimateFreightClass(d.pcf);
    return {
      ok: true,
      headline: { label: 'Shipment density', value: `${fmt(d.pcf, 'density')} lb/ft³`, sub: `${fmt(d.kgM3, 'density')} kg/m³` },
      stats: [
        { label: 'Total weight', value: `${fmt(kg, 'weight')} kg`, hint: `${fmt(kg / KG_PER.lb, 'weight')} lb` },
        { label: 'Total volume', value: `${fmt(m3, 'volume')} m³`, hint: `${fmt(m3 / M3_PER.ft3, 'volume')} ft³` },
        { label: 'Density (kg/m³)', value: `${fmt(d.kgM3, 'density')} kg/m³` },
        { label: 'Density (lb/ft³, PCF)', value: `${fmt(d.pcf, 'density')} lb/ft³` },
      ],
      interpretation: [
        `${fmt(kg, 'weight')} kg in ${fmt(m3, 'volume')} m³ is ${fmt(d.pcf, 'density')} lb/ft³. Higher density means more weight per unit of space.`,
        `For reference, a density-based estimate would place this in class ${classLabel(cls.freightClass)}. That is an estimate, not an official NMFC classification.`,
        `Conversion check: 1 kg/m³ = ${(kgM3ToPcf(1)).toFixed(5)} lb/ft³, and 1 lb/ft³ = ${pcfToKgM3(1).toFixed(3)} kg/m³.`,
      ],
      assumptions: ['Density = total weight ÷ total volume. Volume should be the shipping volume carriers would measure, including pallets and packaging.'],
      links: [{ href: '/freight-class-calculator/', label: 'Need an estimated density-based freight class?' }],
    };
  },
};
export default spec;
