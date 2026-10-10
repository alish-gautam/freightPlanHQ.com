import { fixed, fmt } from '../../formatting';
import { calculateBillableWeight, describeBasis, type DimRule, type PieceInput, type WeightRounding } from '../../calculations/dimensional-weight';
import type { DimPreset } from '../../carrier-rules';
import { sourceById } from '../../sources';
import { Checker } from '../../validation';
import { KG_PER, fromKg } from '../../units';
import { fail, type CalcResult, type FieldDef, type Section, type Values, type NumberField, type SelectField } from '../types';
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
      roundDims: p.rule.dimensionRounding || (p.rule.roundDimensionsUp ? 'up' : 'none'),
      weightRounding: p.rule.weightRounding,
      basis: p.rule.basis,
    };
  }
  return out;
}

export function dimSections(presets: DimPreset[], defaultPreset: DimPreset, rowDefaults: Record<string, number | string>, labels: { rows: string; addLabel: string; item: string; weight: string }): Section[] {
  const isPackage = labels.rows.toLowerCase().includes('package');
  const baseColumns: (NumberField | SelectField)[] = [
    { kind: 'number', id: 'l', label: 'Length', unitFrom: 'unit', default: rowDefaults.l },
    { kind: 'number', id: 'w', label: 'Width', unitFrom: 'unit', default: rowDefaults.w },
    { kind: 'number', id: 'h', label: 'Height', unitFrom: 'unit', default: rowDefaults.h },
    { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: String(rowDefaults.unit) },
    { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: rowDefaults.qty, min: 1 },
    { kind: 'number', id: 'weight', label: labels.weight, unitFrom: 'weightUnit', default: rowDefaults.weight },
  ];

  if (isPackage) {
    baseColumns.push({
      kind: 'select',
      id: 'shape',
      label: 'Shape',
      options: [
        { value: 'rectangular', label: 'Rectangular (Box)' },
        { value: 'nonrectangular', label: 'Nonrectangular / Cylindrical' },
      ],
      default: (rowDefaults.shape as string) || 'rectangular',
    });
  }

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
      columns: baseColumns,
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
        {
          kind: 'select',
          id: 'roundDims',
          label: 'Dimension measurement rounding',
          options: [
            { value: 'none', label: 'No rounding (exact entered dimensions)' },
            { value: 'up', label: 'Round up each dimension to next whole unit (USPS DMM, UPS)' },
            { value: 'nearest', label: 'Round each dimension to nearest whole unit (FedEx packaging guidance)' },
          ],
          default: defaultPreset.rule.dimensionRounding || (defaultPreset.rule.roundDimensionsUp ? 'up' : 'none'),
          help: 'USPS and UPS round up fractional dimensions to the next whole inch; FedEx packaging guidance specifies rounding to the nearest whole inch.',
        },
        {
          kind: 'select',
          id: 'weightRounding',
          label: 'Round billable weight up',
          options: [
            { value: 'none', label: 'No rounding' },
            { value: 'half', label: 'Up to next 0.5' },
            { value: 'whole', label: 'Up to next whole unit' },
            { value: 'half-then-whole', label: '0.5 lb under 0.5 lb, then next whole lb (USPS Express)' },
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
    return ok
      ? {
          length: num(r.l)!,
          width: num(r.w)!,
          height: num(r.h)!,
          unit: lengthUnit(r.unit),
          quantity: num(r.qty)!,
          weightEach: num(r.weight)!,
          weightUnit: wu,
          shape: (r.shape === 'nonrectangular' ? 'nonrectangular' : 'rectangular') as 'rectangular' | 'nonrectangular',
        }
      : null;
  });
  if (!c.ok) return fail(c.issues);
  const metric = str(v.divisorUnit, 'cm3kg') === 'cm3kg';
  const preset = o.presets.find((p) => p.id === str(v.preset));

  let dimRounding: 'none' | 'up' | 'nearest' = 'none';
  if (v.roundDims !== undefined) {
    if (v.roundDims === 'nearest') dimRounding = 'nearest';
    else if (v.roundDims === 'up' || bool(v.roundDims)) dimRounding = 'up';
    else dimRounding = 'none';
  } else if (preset?.rule.dimensionRounding) {
    dimRounding = preset.rule.dimensionRounding;
  } else if (preset?.rule.roundDimensionsUp) {
    dimRounding = 'up';
  }

  const nonrectDimRounding =
    dimRounding === 'none'
      ? 'none'
      : (preset?.rule.nonrectangularDimensionRounding ?? dimRounding);

  const rule: DimRule = {
    divisor: divisor!,
    nonrectangularDivisor: preset?.rule.nonrectangularDivisor,
    nonrectangularFactor: preset?.rule.nonrectangularFactor,
    minVolumeThreshold: preset?.rule.minVolumeThreshold,
    maxRatedWeight: preset?.rule.maxRatedWeight,
    maxScaleWeight: preset?.rule.maxScaleWeight,
    divisorLengthUnit: metric ? 'cm' : 'in',
    divisorWeightUnit: metric ? 'kg' : 'lb',
    dimensionRounding: dimRounding,
    nonrectangularDimensionRounding: nonrectDimRounding,
    roundDimensionsUp: dimRounding === 'up',
    weightRounding: str(v.weightRounding, 'none') as WeightRounding,
    basis: str(v.basis, 'shipment') === 'piece' ? 'piece' : 'shipment',
  };
  const res = calculateBillableWeight(pieces as PieceInput[], rule);
  const u = rule.divisorWeightUnit;
  const other = (w: number) => (u === 'kg' ? `${fmt(w / KG_PER.lb, 'weight')} lb` : `${fmt(fromKg(w * KG_PER.lb, 'kg'), 'weight')} kg`);
  const label = o.kind === 'air' ? { actual: 'Total gross weight', dim: 'Total volumetric weight', bill: 'Chargeable weight' } : { actual: 'Actual weight', dim: 'Dimensional weight', bill: 'Billable weight' };
  const src = preset ? sourceById(preset.source) : null;
  const basisText = describeBasis(res);
  const interp = [basisText];
  if (res.isOverweight) {
    const limit = rule.maxScaleWeight ?? rule.maxRatedWeight ?? 70;
    interp.push(
      `Package is ineligible for this service: Actual physical scale weight (${fmt(res.totalActual, 'weight')} ${u}) exceeds the maximum allowable limit of ${limit} ${u} for ${preset?.label ?? 'this service'} (USPS DMM 101.3.1 / 123.1.2 / 223.1.2). The 70 lb pricing tier cap applies only to qualifying packages whose actual scale weight is 70 lb or less but whose dimensional weight exceeds 70 lb. Physical parcels over 70 lb cannot be mailed via USPS Priority Mail or Priority Mail Express.`
    );
  } else if (rule.minVolumeThreshold !== undefined && res.totalDimensional === 0) {
    interp.push(
      'Because the parcel volume does not exceed 1,728 in³ (1 cu ft), USPS dimensional weight pricing does not apply. The package is rated based on actual scale weight (rounded up to the applicable service weight increment, such as whole pounds or 0.5 lb for Express). Note that weight alone does not determine total postage; destination zone, shape surcharges, and other applicable fees may also apply.'
    );
  } else if (rule.maxRatedWeight !== undefined && res.totalDimensional > rule.maxRatedWeight) {
    interp.push(
      `Calculated dimensional weight (${fmt(res.totalDimensional, 'weight')} ${u}) exceeds the ${rule.maxRatedWeight} ${u} USPS pricing cap. Per DMM standards, the package is charged at the ${rule.maxRatedWeight}-${u} price rather than an uncapped rate.`
    );
  } else if (res.basisWon === 'dimensional') {
    interp.push(`Space, not scale weight, drives the charge. Reducing package size would reduce the ${label.dim.toLowerCase()}.`);
  } else if (res.basisWon === 'actual') {
    interp.push('Scale weight drives the charge. Shrinking the packaging alone would not lower it.');
  } else {
    interp.push('Both measures are equal, so either one gives the same weight.');
  }
  interp.push(rule.basis === 'piece' ? 'Each piece was compared separately, then the billable amounts were added.' : 'Totals for the whole shipment were compared.');
  const assumptions = [
    `Divisor ${fixed(rule.divisor, rule.divisor % 1 ? 2 : 0)} ${metric ? 'cm³ per kg' : 'in³ per lb'}${preset ? ` (${preset.label})` : ' (custom)'}.`,
    rule.dimensionRounding === 'nearest'
      ? 'Each dimension was rounded to the nearest whole unit before multiplying (FedEx packaging guidance).'
      : rule.dimensionRounding === 'up' || rule.roundDimensionsUp
      ? rule.nonrectangularDimensionRounding === 'nearest'
        ? `Rectangular dimensions were rounded up to the next whole ${rule.divisorLengthUnit} (DMM 223.1.4.2); nonrectangular dimensions were rounded off to the nearest whole ${rule.divisorLengthUnit} (DMM 223.1.4.3).`
        : `Each dimension was rounded up to a whole ${rule.divisorLengthUnit} before multiplying (USPS DMM / UPS).`
      : 'Dimensions were not rounded before multiplying.',
    rule.weightRounding === 'none'
      ? 'Billable weight was not rounded.'
      : rule.weightRounding === 'half-then-whole'
      ? `Rated weight follows service-specific postage increments: pieces up to 0.5 ${u} are rated at 0.5 ${u}; weights over 0.5 ${u} round up to the next whole ${u}.`
      : `Billable weight was rounded up to the next ${rule.weightRounding === 'half' ? '0.5' : 'whole'} ${u}.`,
  ];
  if (rule.minVolumeThreshold) {
    assumptions.push(`Eligibility: Parcels measuring ${fmt(rule.minVolumeThreshold, 'count')} ${rule.divisorLengthUnit}³ (1 cu ft) or less are rated on actual weight.`);
  }
  if (rule.nonrectangularFactor) {
    assumptions.push(`Nonrectangular parcels: Applied adjustment factor ${rule.nonrectangularFactor}${rule.nonrectangularDivisor ? ` with divisor ${rule.nonrectangularDivisor}` : ''}.`);
  }
  if (rule.maxRatedWeight) {
    assumptions.push(`Pricing tier cap: Dimensional weights exceeding ${rule.maxRatedWeight} ${u} are charged at the ${rule.maxRatedWeight}-${u} price per USPS DMM standards.`);
  }
  if (src) assumptions.push(`Reference: ${src.organization}. Reference check ${src.verified} (secondary cross-check). ${preset!.limitation}`);
  const warnings =
    o.kind === 'air'
      ? ['Confirm the divisor and rounding rules used by your airline, forwarder, or service.']
      : [
          'Carrier/service divisors and rounding rules may vary. Rated weight is an operational planning estimate and does not represent final postage cost, which also depends on destination zone, base rates, fuel surcharges, and nonmachinable fees.',
        ];

  if (res.isOverweight) {
    const limit = rule.maxScaleWeight ?? rule.maxRatedWeight ?? 70;
    warnings.unshift(
      `Service ineligibility warning: Package actual scale weight (${fmt(res.totalActual, 'weight')} ${u}) exceeds the maximum allowable limit of ${limit} ${u} for ${preset?.label ?? 'this service'} (USPS DMM 101.3.1 / 123.1.2 / 223.1.2). USPS Priority Mail and Priority Mail Express do not accept packages exceeding 70 lb actual physical weight. Overweight packages must be shipped via freight or an alternative carrier and are not eligible for the 70 lb pricing tier.`
    );
  }

  const headlineSub = res.isOverweight
    ? `Ineligible — actual scale weight exceeds ${rule.maxScaleWeight ?? rule.maxRatedWeight ?? 70} ${u} service limit`
    : basisText;

  return {
    ok: true,
    headline: { label: label.bill, value: `${fmt(res.billable, 'weight')} ${u}`, sub: headlineSub },
    stats: [
      { label: label.actual, value: `${fmt(res.totalActual, 'weight')} ${u}`, hint: other(res.totalActual) },
      {
        label: label.dim,
        value: `${fmt(res.totalDimensional, 'weight')} ${u}`,
        hint: res.totalUnroundedDimensional !== res.totalDimensional && res.totalUnroundedDimensional > 0
          ? `Unrounded quotient: ${fmt(res.totalUnroundedDimensional, 'weight')} ${u} (${other(res.totalDimensional)})`
          : other(res.totalDimensional),
      },
      { label: label.bill, value: `${fmt(res.billable, 'weight')} ${u}`, hint: other(res.billable) },
    ],
    interpretation: interp,
    assumptions,
    warnings,
    tables: [
      {
        caption: `Weights by row (${u})`,
        head: ['Row', 'Pieces', 'Measured Actual', 'Unrounded Quotient', 'Calculated Dimensional', 'Rated Billable', 'Governing Weight'],
        rows: res.rows.map((r, i) => [
          `Row ${i + 1}`,
          fmt(r.quantity, 'count'),
          fmt(r.actual, 'weight'),
          fmt(r.unroundedDimensional, 'weight'),
          fmt(r.dimensional, 'weight'),
          fmt(r.billable, 'weight'),
          r.basisWon === 'equal' ? 'Equal' : r.basisWon === 'actual' ? 'Actual weight' : 'Dimensional weight',
        ]),
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
