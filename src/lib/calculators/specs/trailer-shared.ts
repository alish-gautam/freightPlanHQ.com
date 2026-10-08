import { fixed, fmt, pct } from '../../formatting';
import { planTrailerFloor, type TrailerFloorResult } from '../../calculations/trailer-floor';
import { palletSizes } from '../../standards/pallets';
import { Checker } from '../../validation';
import { fail, type CalcResult, type Section } from '../types';
import { LENGTH_OPTIONS, bool, fmtLen, lengthUnit, num, toMm, fromMm } from './shared';
import { floorDiagram } from './diagram-helpers';

type U = ReturnType<typeof lengthUnit>;

export function trailerSections(o: { unit: U; trailerW: number; trailerL: number; item: { l: number; w: number; h: number }; qty: number; presetDefault: string; widthLabel: string; lengthLabel: string; presetFillUnit: U }): Section[] {
  const fills: Record<string, Record<string, number | string>> = {};
  for (const p of palletSizes) fills[p.id] = { il: o.presetFillUnit === 'in' ? Math.round((p.lengthMm / 25.4) * 10) / 10 : p.lengthMm, iw: o.presetFillUnit === 'in' ? Math.round((p.widthMm / 25.4) * 10) / 10 : p.widthMm, dimUnit: o.presetFillUnit };
  return [
    {
      title: 'Freight',
      fields: [
        { kind: 'select', id: 'dimUnit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: o.unit },
        { kind: 'select', id: 'pp', label: 'Pallet or item size', options: [...palletSizes.map((p) => ({ value: p.id, label: `${p.label} — ${p.lengthMm} × ${p.widthMm} mm` })), { value: 'custom', label: 'Custom size' }], default: o.presetDefault, fills },
        { kind: 'number', id: 'il', label: 'Item length', unitFrom: 'dimUnit', default: o.item.l },
        { kind: 'number', id: 'iw', label: 'Item width', unitFrom: 'dimUnit', default: o.item.w },
        { kind: 'number', id: 'ih', label: 'Item height', unitFrom: 'dimUnit', default: o.item.h },
        { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: o.qty, min: 1 },
      ],
    },
    {
      title: 'Trailer',
      fields: [
        { kind: 'number', id: 'tw', label: o.widthLabel, unitFrom: 'dimUnit', default: o.trailerW, help: 'Editable planning value. Use the usable width your carrier or forwarder works with.' },
        { kind: 'number', id: 'tl', label: o.lengthLabel, unitFrom: 'dimUnit', default: o.trailerL, optional: true, help: 'Used to check that the freight fits. Leave empty for no limit.' },
      ],
    },
    {
      advanced: true,
      title: 'Orientation and stacking',
      fields: [
        { kind: 'check', id: 'rotate', label: 'Allow turning items 90° on the floor', default: true },
        { kind: 'number', id: 'stack', label: 'Stack levels (1 = not stackable)', integer: true, default: 1, min: 1 },
        { kind: 'number', id: 'th', label: 'Trailer internal height', unitFrom: 'dimUnit', optional: true, help: 'If entered, stacking is limited to what fits under it.' },
      ],
    },
  ];
}

export interface TrailerParsed {
  du: U;
  r: TrailerFloorResult;
  width: number;
  length: number | null;
  qty: number;
  item: { l: number; w: number; h: number };
}

export function parseTrailer(v: Record<string, unknown>, c: Checker): TrailerParsed | { error: string[] } {
  const du = lengthUnit(v.dimUnit, 'cm');
  const ok = [c.positive(num(v.il), 'Item length'), c.positive(num(v.iw), 'Item width'), c.positive(num(v.ih), 'Item height'), c.integerPositive(num(v.qty), 'Quantity'), c.positive(num(v.tw), 'Trailer width'), c.integerPositive(num(v.stack) ?? 1, 'Stack levels')].every(Boolean);
  const tl = num(v.tl);
  const th = num(v.th);
  if (tl !== null) c.positive(tl, 'Trailer length');
  if (th !== null) c.positive(th, 'Trailer height');
  if (!ok || !c.ok) return { error: c.issues };
  const item = { l: toMm(num(v.il)!, du), w: toMm(num(v.iw)!, du), h: toMm(num(v.ih)!, du) };
  const r = planTrailerFloor({ item, quantity: num(v.qty)!, trailerWidth: toMm(num(v.tw)!, du), trailerLength: tl === null ? null : toMm(tl, du), stackLevels: num(v.stack) ?? 1, trailerHeight: th === null ? null : toMm(th, du), rotate: bool(v.rotate) });
  if (r.issues.length) return { error: r.issues };
  return { du, r, width: toMm(num(v.tw)!, du), length: tl === null ? null : toMm(tl, du), qty: num(v.qty)!, item };
}

export function trailerDiagram(p: TrailerParsed, what: string) {
  return floorDiagram({
    placements: p.r.placements,
    binX: p.length ?? Math.max(p.r.lengthUsed, 1),
    binY: p.width,
    unit: p.du,
    what,
    binName: 'trailer',
    labels: p.r.orientationCounts.map((o) => `${o.label}: ${o.count}`),
    endLabel: 'Front of trailer (x = 0)',
    title: 'Trailer floor layout (top view)',
  });
}

export const trailerCommonStats = (p: TrailerParsed) => [
  { label: 'Floor positions', value: fmt(p.r.floorPositions, 'count'), hint: p.r.effectiveStack > 1 ? `${p.qty} items ÷ ${p.r.effectiveStack} stack levels` : undefined },
  { label: 'Rows across the trailer length', value: fmt(p.r.rows, 'count') },
  { label: 'Units per row (max)', value: fmt(p.r.unitsPerRow, 'count') },
  ...(p.r.trailerUtilization !== null ? [{ label: 'Trailer length used', value: pct(p.r.trailerUtilization) }] : []),
  { label: 'Floor area utilization (used length)', value: pct(p.r.floorAreaUtilization) },
];

export const failFrom = (e: { error: string[] }): CalcResult => fail(e.error);
void fixed;
void fmtLen;
void fromMm;
