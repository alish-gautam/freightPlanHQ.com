import { fixed, fmt } from '../../formatting';
import { calculateBillableWeight, describeBasis, type DimRule, type PieceInput, type WeightRounding } from '../../calculations/dimensional-weight';
import type { DimPreset } from '../../carrier-rules';
import { sourceById } from '../../sources';
import { Checker } from '../../validation';
import { KG_PER, fromKg } from '../../units';
import { fail, type CalcResult, type FieldDef, type Section, type Values } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, lengthUnit, num, rows, str, weightUnit, bool } from './shared';

const DIVISOR_UNITS = [
  { value: 'cm3kg', label: 'cm³ per kg' },
  { value: 'in3lb', label: 'in³ per lb' },
];

export function presetFills(presets: DimPreset[]): Record<string, Record<string, number | string | boolean>> {
  const out: Record<string, Record<string, number | string | boolean>> = {};
  for (const p of presets) {
    out[p.id] = {
      divisor: p.rule.divisor,
      divisorUnit: p.rule.divisorLengthUnit === 'cm' ? 'cm3kg' : 'in3lb',
      roundDims: p.rule.roundDimensionsUp,
      weightRounding: p.rule.weightRounding,
      basis: p.rule.basis,
    };
  }
  return out;
}

export function dimSections(presets: DimPreset[], defaultPreset: DimPreset, rowDefaults: Record<string, number | string>, labels: { rows: string; addLabel: string; item: string; weight: string }): Section[] {
  const fields: FieldDef[] = [
    {
      kind: 'select',
      id: 'preset',
      label: 'Rule preset',
      options: [...presets.map((p) => ({ value: p.id, label: p.label })), { value: 'custom', label: 'Custom divisor' }],
      default: defaultPreset.id,
      fills: presetFills(presets),
      help: 'Presets are reference values. Confirm the divisor your carrier, airline or forwarder actually applies.',
    },
    { kind: 'number', id: 'divisor', label: 'Divisor', default: defaultPreset.rule.divisor, suffix: '' },
    { kind: 'select', id: 'divisorUnit', label: 'Divisor unit', options: DIVISOR_UNITS, default: defaultPreset.rule.divisorLengthUnit === 'cm' ? 'cm3kg' : 'in3lb' },
    { kind: 'select', id: 'weightUnit', label: 'Actual weight unit', options: WEIGHT_OPTIONS.filter((o) => o.value === 'kg' || o.value === 'lb'), default: defaultPreset.rule.divisorWeightUnit },
    {
      kind: 'rows',
      id: 'items',
      label: labels.rows,
      itemLabel: labels.item,
      addLabel: labels.addLabel,
      max: 50,
      columns: [
        { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: rowDefaults.l },
        { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: rowDefaults.w },
        { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: rowDefaults.h },
        { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: String(rowDefaults.unit) },
        { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: rowDefaults.qty, min: 1 },
        { kind: 'number', id: 'weight', label: labels.weight, unitFrom: 'weightUnit', default: rowDefaults.weight },
      ],
      defaults: [rowDefaults],
    },
  ];
  return [
    { title: 'Rule', fields: fields.slice(0, 4) },
    { title: 'Pieces', fields: fields.slice(4) },
    {
      advanced: true,
      title: 'Rounding and comparison',
      fields: [
        {
          kind: 'select',
          id: 'basis',
          label: 'Compare actual vs dimensional weight',
          options: [
            { value: 'shipment', label: 'For the whole shipment' },
            { value: 'piece', label: 'Per piece, then add up' },
          ],
          default: defaultPreset.rule.basis,
          help: 'Some services compare each package separately. Others compare shipment totals.',
        },
        { kind: 'check', id: 'roundDims', label: 'Round each dimension up to a whole unit of the divisor (cm or in) first', default: defaultPreset.rule.roundDimensionsUp, help: 'Use only if your service states this rule.' },
        {
          kind: 'select',
          id: 'weightRounding',
          label: 'Round billable weight up',
          options: [
            { value: 'none', label: 'No rounding' },
            { value: 'half', label: 'Up to next 0.5' },
            { value: 'whole', label: 'Up to next whole unit' },
          ],
          default: defaultPreset.rule.weightRounding,
        },
      ],
    },
  ];
}

export interface DimComputeOpts {
  presets: DimPreset[];
  /** wording */
  kind: 'dim' | 'air';
}

export function computeDim(v: Values, o: DimComputeOpts): CalcResult {
  const c = new Checker();
  const divisor = num(v.divisor);
  c.positive(divisor, 'Divisor');
  const list = rows(v.items);
  if (!list.length) return fail(['Add at least one piece.']);
  const wu = weightUnit(v.weightUnit);
  const pieces: (PieceInput | null)[] = list.map((r, i) => {
    const n = `Piece ${i + 1}`;
    const ok = [c.positive(num(r.l), `${n} length`), c.positive(num(r.w), `${n} width`), c.positive(num(r.h), `${n} height`), c.integerPositive(num(r.qty), `${n} quantity`), c.positive(num(r.weight), `${n} weight`)].every(Boolean);
    return ok ? { length: num(r.l)!, width: num(r.w)!, height: num(r.h)!, unit: lengthUnit(r.unit), quantity: num(r.qty)!, weightEach: num(r.weight)!, weightUnit: wu } : null;
  });
  if (!c.ok) return fail(c.issues);
  const metric = str(v.divisorUnit, 'cm3kg') === 'cm3kg';
  const rule: DimRule = {
    divisor: divisor!,
    divisorLengthUnit: metric ? 'cm' : 'in',
    divisorWeightUnit: metric ? 'kg' : 'lb',
    roundDimensionsUp: bool(v.roundDims),
    weightRounding: str(v.weightRounding, 'none') as WeightRounding,
    basis: str(v.basis, 'shipment') === 'piece' ? 'piece' : 'shipment',
  };
  const res = calculateBillableWeight(pieces as PieceInput[], rule);
  const u = rule.divisorWeightUnit;
  const other = (w: number) => (u === 'kg' ? `${fmt(w / KG_PER.lb, 'weight')} lb` : `${fmt(fromKg(w * KG_PER.lb, 'kg'), 'weight')} kg`);
  const label = o.kind === 'air' ? { actual: 'Total gross weight', dim: 'Total volumetric weight', bill: 'Chargeable weight' } : { actual: 'Actual weight', dim: 'Dimensional weight', bill: 'Billable weight' };
  const preset = o.presets.find((p) => p.id === str(v.preset));
  const src = preset ? sourceById(preset.source) : null;
  const basisText = describeBasis(res);
  const interp = [basisText];
  if (res.basisWon === 'dimensional') interp.push(`Space, not scale weight, drives the charge. Reducing package size would reduce the ${label.dim.toLowerCase()}.`);
  else if (res.basisWon === 'actual') interp.push('Scale weight drives the charge. Shrinking the packaging alone would not lower it.');
  else interp.push('Both measures are equal, so either one gives the same weight.');
  interp.push(rule.basis === 'piece' ? 'Each piece was compared separately, then the billable amounts were added.' : 'Totals for the whole shipment were compared.');
  const assumptions = [
    `Divisor ${fixed(rule.divisor, rule.divisor % 1 ? 2 : 0)} ${metric ? 'cm³ per kg' : 'in³ per lb'}${preset ? ` (${preset.label})` : ' (custom)'}.`,
    rule.roundDimensionsUp ? `Each dimension was rounded up to a whole ${rule.divisorLengthUnit} before multiplying.` : 'Dimensions were not rounded before multiplying.',
    rule.weightRounding === 'none' ? 'Billable weight was not rounded.' : `Billable weight was rounded up to the next ${rule.weightRounding === 'half' ? '0.5' : 'whole'} ${u}.`,
  ];
  if (src) assumptions.push(`Reference: ${src.organization}. Reference check ${src.verified} (secondary cross-check). ${preset!.limitation}`);
  const warnings = o.kind === 'air' ? ['Confirm the divisor and rounding rules used by your airline, forwarder, or service.'] : ['Carrier/service divisors and rounding rules may vary.'];
  return {
    ok: true,
    headline: { label: label.bill, value: `${fmt(res.billable, 'weight')} ${u}`, sub: basisText },
    stats: [
      { label: label.actual, value: `${fmt(res.totalActual, 'weight')} ${u}`, hint: other(res.totalActual) },
      { label: label.dim, value: `${fmt(res.totalDimensional, 'weight')} ${u}`, hint: other(res.totalDimensional) },
      { label: label.bill, value: `${fmt(res.billable, 'weight')} ${u}`, hint: other(res.billable) },
    ],
    interpretation: interp,
    assumptions,
    warnings,
    tables: [
      {
        caption: `Weights by row (${u})`,
        head: ['Row', 'Pieces', 'Actual', 'Dimensional', 'Billable', 'Greater'],
        rows: res.rows.map((r, i) => [`Row ${i + 1}`, fmt(r.quantity, 'count'), fmt(r.actual, 'weight'), fmt(r.dimensional, 'weight'), fmt(r.billable, 'weight'), r.basisWon === 'equal' ? 'Equal' : r.basisWon === 'actual' ? 'Actual' : 'Dimensional']),
      },
    ],
    links:
      o.kind === 'dim'
        ? [
            { href: '/package-girth-calculator/', label: 'Check length and girth limits' },
            { href: '/guides/actual-weight-vs-dimensional-weight/', label: 'Actual vs dimensional weight explained' },
          ]
        : [
            { href: '/cbm-calculator/', label: 'Calculate CBM for the same cargo' },
            { href: '/guides/air-freight-chargeable-weight/', label: 'How chargeable weight works' },
          ],
  };
}
