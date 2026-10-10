import { fixed, fmt, pct } from '../../formatting';
import { planPallet } from '../../calculations/pallet';
import { palletSizes } from '../../standards/pallets';
import { Checker } from '../../validation';
import { toKg } from '../../units';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, bool, fmtKg, fmtLen, lengthUnit, num, toMm, weightUnit } from './shared';
import { stackDiagrams } from './diagram-helpers';

const fills: Record<string, Record<string, number | string>> = {};
for (const p of palletSizes) fills[p.id] = { palletL: p.lengthMm, palletW: p.widthMm, dimUnit: 'mm' };

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Units',
      fields: [
        { kind: 'select', id: 'dimUnit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'mm' },
        { kind: 'select', id: 'weightUnit', label: 'Weight unit', options: WEIGHT_OPTIONS.slice(0, 2), default: 'kg' },
      ],
    },
    {
      title: 'Carton',
      fields: [
        { kind: 'number', id: 'cl', label: 'Carton length', unitFrom: 'dimUnit', default: 400 },
        { kind: 'number', id: 'cw', label: 'Carton width', unitFrom: 'dimUnit', default: 300 },
        { kind: 'number', id: 'ch', label: 'Carton height', unitFrom: 'dimUnit', default: 250 },
        { kind: 'number', id: 'cwt', label: 'Gross weight of one carton', unitFrom: 'weightUnit', default: 12 },
        { kind: 'number', id: 'qty', label: 'Order quantity (cartons)', integer: true, default: 500, min: 1 },
      ],
    },
    {
      title: 'Pallet',
      fields: [
        {
          kind: 'select',
          id: 'palletPreset',
          label: 'Pallet size',
          options: [...palletSizes.map((p) => ({ value: p.id, label: `${p.label} — ${p.lengthMm} × ${p.widthMm} mm` })), { value: 'custom', label: 'Custom pallet' }],
          default: 'eur2',
          fills,
          help: 'Reference footprints from ISO 6780 / EPAL. Pallet height, tare and rating vary by pallet.',
        },
        { kind: 'number', id: 'palletL', label: 'Pallet length', unitFrom: 'dimUnit', default: 1200 },
        { kind: 'number', id: 'palletW', label: 'Pallet width', unitFrom: 'dimUnit', default: 1000 },
        { kind: 'number', id: 'deck', label: 'Pallet height (deck)', unitFrom: 'dimUnit', default: 150, help: 'Measure your pallet. 150 mm is an editable starting value.' },
        { kind: 'number', id: 'tare', label: 'Pallet weight (tare)', unitFrom: 'weightUnit', default: 25, help: 'Editable starting value. Weigh your pallet.' },
        { kind: 'number', id: 'payload', label: 'Maximum cargo weight', unitFrom: 'weightUnit', default: 1000, optional: true, help: 'Pallet load rating or your limit. Leave empty for no weight limit.' },
        { kind: 'number', id: 'maxH', label: 'Maximum loaded height (from floor)', unitFrom: 'dimUnit', default: 1800, help: 'Includes the pallet. Set by your carrier, trailer or container.' },
      ],
    },
    {
      advanced: true,
      title: 'Orientation and clearance',
      fields: [
        { kind: 'check', id: 'upright', label: 'Keep cartons upright (do not lay them on their sides)', default: true },
        { kind: 'check', id: 'rotate', label: 'Allow 90° rotation on the pallet floor', default: true },
        { kind: 'check', id: 'stackable', label: 'Cartons can be stacked in layers', default: true },
        { kind: 'number', id: 'edge', label: 'Edge clearance from pallet edge', unitFrom: 'dimUnit', default: 0, optional: true },
        { kind: 'number', id: 'overhang', label: 'Allowed overhang beyond each edge', unitFrom: 'dimUnit', default: 0, optional: true, help: 'Only enter overhang if your carrier explicitly allows it.' },
        { kind: 'number', id: 'topClear', label: 'Minimum clearance above top layer', unitFrom: 'dimUnit', default: 0, optional: true },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const du = lengthUnit(v.dimUnit, 'mm');
    const wu = weightUnit(v.weightUnit);
    const ok = [
      c.positive(num(v.cl), 'Carton length'),
      c.positive(num(v.cw), 'Carton width'),
      c.positive(num(v.ch), 'Carton height'),
      c.positive(num(v.cwt), 'Carton weight'),
      c.integerPositive(num(v.qty), 'Order quantity'),
      c.positive(num(v.palletL), 'Pallet length'),
      c.positive(num(v.palletW), 'Pallet width'),
      c.positive(num(v.deck), 'Pallet height'),
      c.nonNegative(num(v.tare), 'Pallet weight'),
      c.positive(num(v.maxH), 'Maximum loaded height'),
    ].every(Boolean);
    const payload = num(v.payload);
    if (payload !== null) c.positive(payload, 'Maximum cargo weight');
    const edge = num(v.edge) ?? 0;
    const over = num(v.overhang) ?? 0;
    const top = num(v.topClear) ?? 0;
    c.nonNegative(edge, 'Edge clearance');
    c.nonNegative(over, 'Overhang');
    c.nonNegative(top, 'Clearance above top layer');
    if (!ok || !c.ok) return fail(c.issues);
    if (num(v.maxH)! <= num(v.deck)!) return fail(['The maximum loaded height must be greater than the pallet height. Enter a larger maximum loaded height.']);
    const m = (x: number) => toMm(x, du);
    const r = planPallet({
      carton: { l: m(num(v.cl)!), w: m(num(v.cw)!), h: m(num(v.ch)!), weightKg: toKg(num(v.cwt)!, wu) },
      quantity: num(v.qty)!,
      pallet: { l: m(num(v.palletL)!), w: m(num(v.palletW)!), deck: m(num(v.deck)!), tareKg: toKg(num(v.tare)!, wu), maxPayloadKg: payload === null ? null : toKg(payload, wu), maxHeight: m(num(v.maxH)!) },
      upright: bool(v.upright),
      rotateFloor: bool(v.rotate),
      edgeClearance: m(edge),
      overhang: m(over),
      stackable: bool(v.stackable),
      topClearance: m(top),
    });
    if (r.issues.length) return fail(r.issues);
    const lim = {
      height: 'Height is the limiting constraint: another layer would exceed the maximum loaded height.',
      payload: 'Weight is the limiting constraint: another carton would exceed the maximum cargo weight.',
      footprint: bool(v.stackable) ? 'The footprint is the limiting constraint: no further full layer fits.' : 'The footprint is the limiting constraint because stacking is turned off, so only one layer is loaded.',
      quantity: 'Quantity is the limiting constraint: the whole order fits on one pallet.',
    }[r.limit];
    const interp = [
      `Best layout found: ${r.ti} cartons per layer × ${r.hi} layer${r.hi === 1 ? '' : 's'} = ${r.cartonsPerPallet} cartons per pallet.`,
      lim,
      r.limit === 'quantity' ? `A full pallet would be limited by ${r.capacityLimit === 'payload' ? 'weight' : r.capacityLimit}.` : '',
      `The order of ${fmt(num(v.qty)!, 'count')} cartons needs ${r.palletsRequired} pallet${r.palletsRequired === 1 ? '' : 's'}; the last one carries ${r.cartonsOnFinalPallet}.`,
    ].filter(Boolean);
    const x0 = r.region.x0;
    const y0 = r.region.y0;
    const diagrams = stackDiagrams({
      placements: r.placements,
      binX: m(num(v.palletL)!),
      binY: m(num(v.palletW)!),
      binZ: m(num(v.maxH)!),
      base: m(num(v.deck)!),
      originX: x0,
      originY: y0,
      region: edge || over ? r.region : undefined,
      unit: du,
      what: 'cartons',
      binName: 'pallet',
    });
    return {
      ok: true,
      headline: { label: 'Cartons per pallet', value: fmt(r.cartonsPerPallet, 'count'), sub: `TI ${r.ti} × HI ${r.hi} · best layout found` },
      stats: [
        { label: 'TI (cartons per layer)', value: fmt(r.ti, 'count') },
        { label: 'HI (layers)', value: fmt(r.hi, 'count') },
        { label: 'Pallets required', value: fmt(r.palletsRequired, 'count') },
        { label: 'Cartons on final pallet', value: fmt(r.cartonsOnFinalPallet, 'count') },
        { label: 'Loaded height', value: fmtLen(r.loadedHeight, du) },
        { label: 'Remaining height', value: fmtLen(Math.max(0, r.remainingHeight), du) },
        { label: 'Cargo weight (full pallet)', value: fmtKg(r.cargoWeightKg, wu) },
        { label: 'Pallet tare', value: fmtKg(r.tareKg, wu) },
        { label: 'Gross pallet weight', value: fmtKg(r.grossWeightKg, wu) },
        { label: 'Remaining payload', value: r.remainingPayloadKg === null ? 'No limit set' : fmtKg(r.remainingPayloadKg, wu) },
        { label: 'Footprint utilization', value: pct(r.footprintUtilization) },
        { label: 'Volume utilization', value: pct(r.volumeUtilization) },
      ],
      interpretation: interp,
      warnings: [
        ...(r.footprintUtilization > 1.0001 ? ['Cartons overhang the pallet footprint because you allowed overhang. Confirm your carrier accepts it.'] : []),
        ...(r.reducedSearch ? ['This footprint was large and awkward, so a simplified search was used. Another arrangement may fit slightly more.'] : []),
      ],
      diagrams,
      tables: [
        {
          caption: 'Layers (bottom to top)',
          head: ['Layer', 'Cartons', 'Orientation'],
          rows: r.layers.map((l) => [String(l.index + 1), fmt(l.count, 'count'), l.orientation]),
        },
      ],
      assumptions: [
        'Rectangular, identical cartons; every layer is packed flat on the one below.',
        `Objective: satisfy all limits, then maximise cartons per pallet, then footprint use. Search covers guillotine-cut arrangements of the allowed orientations, so this is the best tested arrangement, not a proof of the global optimum.`,
        'Dimensions are rounded to the nearest millimetre for packing.',
        'Geometric spatial layout estimate only. Does not evaluate corrugated carton compression strength (ECT/BCT), pallet overhang safety, or transit dynamic stability. Physical testing or engineering review is required for shipping safety verification.',
        'Actual loading may require clearance, securing, stacking, and handling allowances.',
      ],
      links: [
        { href: '/pallets-per-container-calculator/', label: 'How many of these pallets fit in a container?' },
        { href: '/container-loading-calculator/', label: 'Load loose cartons into a container' },
      ],
    };
  },
};
export default spec;
void fixed;
