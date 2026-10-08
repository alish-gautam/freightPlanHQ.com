import { fixed, fmt } from '../../formatting';
import { boxVolume } from '../../calculations/volume';
import { Checker } from '../../validation';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, lengthUnit, num, str } from './shared';
import { VOLUME_LABEL, type VolumeUnit } from '../../units';

const PRIMARY: Record<string, VolumeUnit> = { mm: 'litre', cm: 'litre', m: 'm3', in: 'ft3', ft: 'ft3' };

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Box dimensions',
      fields: [
        { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'cm' },
        { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: 60 },
        { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: 40 },
        { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: 40 },
        { kind: 'number', id: 'qty', label: 'Number of boxes', integer: true, default: 1, min: 1, optional: true },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const unit = lengthUnit(v.unit);
    const ok = [c.positive(num(v.l), 'Length'), c.positive(num(v.w), 'Width'), c.positive(num(v.h), 'Height')].every(Boolean);
    const q = num(v.qty) ?? 1;
    c.integerPositive(q, 'Number of boxes');
    if (!ok || !c.ok) return fail(c.issues);
    const r = boxVolume(num(v.l)!, num(v.w)!, num(v.h)!, unit, q);
    const p = PRIMARY[unit];
    const dec = (u: VolumeUnit) => (u === 'm3' ? 4 : u === 'mm3' ? 0 : u === 'cm3' || u === 'in3' ? 1 : 3);
    const order: VolumeUnit[] = ['mm3', 'cm3', 'litre', 'm3', 'in3', 'ft3'];
    const names: Record<VolumeUnit, string> = { mm3: 'Cubic millimetres', cm3: 'Cubic centimetres', litre: 'Litres', m3: 'Cubic metres', in3: 'Cubic inches', ft3: 'Cubic feet' };
    return {
      ok: true,
      headline: { label: q > 1 ? `Volume of one box` : 'Box volume', value: `${fixed(r.each[p], dec(p))} ${VOLUME_LABEL[p]}`, sub: `${fixed(num(v.l)!, 2)} × ${fixed(num(v.w)!, 2)} × ${fixed(num(v.h)!, 2)} ${unit}` },
      stats: q > 1 ? [{ label: `Total for ${fmt(q, 'count')} boxes`, value: `${fixed(r.total[p], dec(p))} ${VOLUME_LABEL[p]}` }] : [],
      interpretation: [
        `One box holds ${fixed(r.each.litre, 3)} litres (${fixed(r.each.m3, 4)} m³, ${fixed(r.each.ft3, 3)} ft³).`,
        'This is the volume of the rectangular box you described. For freight you usually need the outer dimensions of the packed carton.',
      ],
      tables: [
        {
          caption: 'Volume in every unit',
          head: ['Unit', 'One box', ...(q > 1 ? [`${fmt(q, 'count')} boxes`] : [])],
          rows: order.map((u) => [names[u], fixed(r.each[u], dec(u)), ...(q > 1 ? [fixed(r.total[u], dec(u))] : [])]),
        },
      ],
      assumptions: ['V = length × width × height, calculated in metres and converted. Rounded for display only.'],
      links: [{ href: '/cbm-calculator/', label: 'Add multiple cartons and get shipment CBM' }],
    };
  },
};
export default spec;
void str;
