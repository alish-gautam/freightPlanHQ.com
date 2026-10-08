import { fixed, fmt, pct } from '../../formatting';
import { palletsPerContainer } from '../../calculations/container';
import { palletSizes } from '../../standards/pallets';
import { Checker } from '../../validation';
import { toKg } from '../../units';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, bool, fmtLen, lengthUnit, num, str, toMm, weightUnit } from './shared';
import { EQUIPMENT_NOTE } from '../../equipment';
import { containerDimFields, containerFields, equipmentNote, readContainer } from './container-loading-calculator';
import { floorDiagram } from './diagram-helpers';

const fills: Record<string, Record<string, number | string>> = {};
for (const p of palletSizes) fills[p.id] = { pl: p.lengthMm, pw: p.widthMm, dimUnit: 'mm' };

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Container',
      fields: [
        { kind: 'select', id: 'dimUnit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'mm' },
        { kind: 'select', id: 'weightUnit', label: 'Weight unit', options: WEIGHT_OPTIONS.slice(0, 2), default: 'kg' },
        ...containerFields('20ft'),
        ...containerDimFields().slice(0, 3),
      ],
    },
    {
      title: 'Loaded pallet',
      description: 'Enter the pallet as it will actually be loaded, including its cargo and overhang.',
      fields: [
        { kind: 'select', id: 'pp', label: 'Pallet footprint', options: [...palletSizes.map((p) => ({ value: p.id, label: `${p.label} — ${p.lengthMm} × ${p.widthMm} mm` })), { value: 'custom', label: 'Custom pallet' }], default: 'eur', fills },
        { kind: 'number', id: 'pl', label: 'Pallet length', unitFrom: 'dimUnit', default: 1200 },
        { kind: 'number', id: 'pw', label: 'Pallet width', unitFrom: 'dimUnit', default: 800 },
        { kind: 'number', id: 'ph', label: 'Loaded pallet height', unitFrom: 'dimUnit', default: 1200 },
      ],
    },
    {
      advanced: true,
      title: 'Options',
      fields: [
        { kind: 'check', id: 'rotate', label: 'Allow turning pallets 90° (mixed rows)', default: true },
        { kind: 'number', id: 'wall', label: 'Clearance from walls', unitFrom: 'dimUnit', default: 0, optional: true },
        { kind: 'number', id: 'gap', label: 'Gap between pallets', unitFrom: 'dimUnit', default: 0, optional: true },
        { kind: 'number', id: 'tiers', label: 'Stack tiers allowed (1 = no stacking)', integer: true, default: 1, min: 1 },
        { kind: 'number', id: 'pwt', label: 'Weight of one loaded pallet', unitFrom: 'weightUnit', optional: true, help: 'With a payload limit, shows a weight-limited stacked total.' },
        { kind: 'number', id: 'payload', label: 'Payload limit', unitFrom: 'weightUnit', default: 28200, optional: true },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const du = lengthUnit(v.dimUnit, 'mm');
    const wu = weightUnit(v.weightUnit);
    const cont = readContainer(v, c, du, wu);
    const ok = [c.positive(num(v.pl), 'Pallet length'), c.positive(num(v.pw), 'Pallet width'), c.positive(num(v.ph), 'Loaded pallet height'), c.integerPositive(num(v.tiers) ?? 1, 'Stack tiers')].every(Boolean);
    const wall = num(v.wall) ?? 0;
    const gap = num(v.gap) ?? 0;
    c.nonNegative(wall, 'Wall clearance');
    c.nonNegative(gap, 'Gap between pallets');
    const pwt = num(v.pwt);
    if (pwt !== null) c.positive(pwt, 'Loaded pallet weight');
    if (!cont || !ok || !c.ok) return fail(c.issues);
    const r = palletsPerContainer({
      container: cont,
      pallet: { l: toMm(num(v.pl)!, du), w: toMm(num(v.pw)!, du), h: toMm(num(v.ph)!, du), weightKg: pwt === null ? null : toKg(pwt, wu) },
      rotate: bool(v.rotate),
      wallClearance: toMm(wall, du),
      palletGap: toMm(gap, du),
      maxTiers: num(v.tiers) ?? 1,
    });
    if (r.issues.length) return fail(r.issues);
    if (r.perFloor === 0) return fail(['The pallet does not fit on the container floor in any allowed orientation. Check the pallet size or clearance.']);
    const interp = [
      `${r.perFloor} pallet${r.perFloor === 1 ? '' : 's'} fit on the container floor (${r.floorOrientationCounts.map((o) => `${o.count} × ${o.label.toLowerCase()}`).join(', ')}).`,
      `They cover ${pct(r.usableFloorUtilization)} of the usable floor; ${fixed(r.remainingFloorAreaM2, 2)} m² of floor is left over.`,
    ];
    const stats = [
      { label: 'Pallets on the floor', value: fmt(r.perFloor, 'count') },
      { label: 'Floor utilization', value: pct(r.floorUtilization), hint: 'Pallet footprints ÷ container floor' },
      { label: 'Remaining floor space', value: `${fixed(r.remainingFloorAreaM2, 2)} m²` },
    ];
    if (r.tiers > 1) {
      stats.push({ label: `Stacked total (${r.tiers} tiers)`, value: fmt(r.stackedTotal, 'count'), hint: 'Only if your pallets can safely be stacked' });
      interp.push(`Stacking is shown separately: ${r.tiers} tiers fit by height, giving ${r.stackedTotal} pallets if they can be safely double-stacked.`);
    } else interp.push('Stacking is off. Increase “Stack tiers allowed” to see a separate stacked total.');
    if (r.stackedTotalWeightLimited !== null) {
      stats.push({ label: 'Stacked total after payload limit', value: fmt(r.stackedTotalWeightLimited, 'count') });
      if (r.stackedTotalWeightLimited < r.stackedTotal) interp.push('The payload limit, not space, reduces the number of pallets you can load.');
    }
    return {
      ok: true,
      headline: { label: 'Pallets per container (floor, single tier)', value: fmt(r.perFloor, 'count'), sub: `${cont.name} · best tested arrangement` },
      stats,
      interpretation: interp,
      warnings: r.reducedSearch ? ['This footprint was large and awkward, so a simplified search was used.'] : [],
      diagrams: [
        floorDiagram({
          placements: r.placements,
          binX: cont.length,
          binY: cont.width,
          unit: du,
          what: 'pallets',
          binName: 'container',
          labels: r.floorOrientationCounts.map((o) => `${o.label}: ${o.count}`),
          endLabel: 'Back wall (x = 0) → doors at far end',
        }),
      ],
      assumptions: [equipmentNote(str(v.preset)), 'Pallets are treated as solid rectangles on a 2D floor, not as loose cartons. Packing evaluates mixed rows with rotation.', EQUIPMENT_NOTE],
      links: [
        { href: '/pallet-calculator/', label: 'Build the pallets first' },
        { href: '/guides/standard-pallet-sizes/', label: 'Standard pallet sizes' },
      ],
    };
  },
};
export default spec;
void fmtLen;
