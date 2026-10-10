import { fromKg, toKg, toMetres, fromMetres, type LengthUnit, type WeightUnit } from '../units';
import { fmt } from '../formatting';

export type ParcelShape = 'rectangular' | 'nonrectangular';

export interface PieceInput {
  length: number;
  width: number;
  height: number;
  unit: LengthUnit;
  quantity: number;
  /** actual gross weight of ONE piece */
  weightEach: number;
  weightUnit: WeightUnit;
  /** Parcel shape: rectangular box vs nonrectangular / cylindrical */
  shape?: ParcelShape;
}

export type WeightRounding = 'none' | 'half' | 'whole' | 'half-then-whole';
export type DimBasis = 'shipment' | 'piece';

export type DimensionRounding = 'none' | 'up' | 'nearest';

export interface DimRule {
  /** volume per weight unit, e.g. 5000 (cm³/kg) or 139 (in³/lb) */
  divisor: number;
  /** alternate divisor for nonrectangular parcels when carrier differentiates (e.g. USPS Commercial Priority Mail = 166) */
  nonrectangularDivisor?: number;
  /** length unit in which the divisor's volume is expressed */
  divisorLengthUnit: 'cm' | 'in';
  /** weight unit in which the result is expressed */
  divisorWeightUnit: 'kg' | 'lb';
  /** Dimension rounding mode: 'none', 'up' (ceil), or 'nearest' (round) */
  dimensionRounding?: DimensionRounding;
  /** Alternate dimension rounding mode for nonrectangular parcels (e.g. USPS Commercial Priority Mail = 'nearest' per DMM 223.1.4.3) */
  nonrectangularDimensionRounding?: DimensionRounding;
  /** Round each dimension UP to a whole number of the divisor's length unit before multiplying (legacy alias for dimensionRounding: 'up') */
  roundDimensionsUp: boolean;
  weightRounding: WeightRounding;
  basis: DimBasis;
  /** Minimum cubic volume in divisor length unit cubed (e.g. 1728 in³ for USPS Priority Mail) */
  minVolumeThreshold?: number;
  /** Volume adjustment factor for nonrectangular parcels (e.g. 0.785 for USPS cylindrical/nonrectangular parcels) */
  nonrectangularFactor?: number;
  /** Maximum rated/billable weight cap (e.g. 70 lb for USPS Priority Mail where DMM prescribes the 70-pound price if DIM weight exceeds 70 lb) */
  maxRatedWeight?: number;
  /** Maximum allowable physical scale weight for this service (e.g. 70 lb for USPS Priority Mail per DMM 101.3.1 / 123.1.2 / 223.1.2) */
  maxScaleWeight?: number;
}

export interface PieceResult {
  quantity: number;
  actual: number; // in rule weight unit, total for the row
  unroundedDimensional: number; // raw volume / divisor * qty
  dimensional: number; // calculated dimensional weight rounded up per carrier/service rule, total for the row
  billable: number;
  basisWon: 'actual' | 'dimensional' | 'equal';
}

export interface DimResult {
  rule: DimRule;
  rows: PieceResult[];
  /** all in rule.divisorWeightUnit */
  totalActual: number;
  totalUnroundedDimensional: number;
  totalDimensional: number;
  billable: number;
  basisWon: 'actual' | 'dimensional' | 'equal';
  weightUnit: 'kg' | 'lb';
  /** True when actual physical scale weight exceeds carrier service limit */
  isOverweight?: boolean;
}

const TOL = 1e-9;

export function roundWeight(w: number, mode: WeightRounding): number {
  if (mode === 'none') return w;
  if (mode === 'half-then-whole') {
    if (w <= 0) return 0;
    if (w <= 0.5 + TOL) return 0.5;
    return Math.ceil(w - TOL);
  }
  const step = mode === 'half' ? 0.5 : 1;
  return Math.ceil(w / step - TOL) * step;
}

function dimsInRuleUnit(p: PieceInput, rule: DimRule): [number, number, number] {
  const defaultMode: DimensionRounding = rule.dimensionRounding ?? (rule.roundDimensionsUp ? 'up' : 'none');
  const isNonrect = p.shape === 'nonrectangular';
  const mode: DimensionRounding = isNonrect && rule.nonrectangularDimensionRounding !== undefined
    ? rule.nonrectangularDimensionRounding
    : defaultMode;

  return [p.length, p.width, p.height].map((d) => {
    const v = p.unit === rule.divisorLengthUnit ? d : fromMetres(toMetres(d, p.unit), rule.divisorLengthUnit);
    if (mode === 'up') return Math.ceil(v - TOL);
    if (mode === 'nearest') return Math.round(v);
    return v;
  }) as [number, number, number];
}

export function dimensionalWeightOfPiece(p: PieceInput, rule: DimRule): number {
  const [l, w, h] = dimsInRuleUnit(p, rule);
  const rawVolume = l * w * h;

  const isNonrect = p.shape === 'nonrectangular';
  const effectiveVolume = isNonrect && rule.nonrectangularFactor !== undefined
    ? rawVolume * rule.nonrectangularFactor
    : rawVolume;

  // Threshold check (e.g. USPS Priority Mail parcels must exceed 1 cu ft / 1,728 in³)
  // The threshold check applies to the adjusted volume for nonrectangular parcels per USPS DMM.
  if (rule.minVolumeThreshold !== undefined && effectiveVolume <= rule.minVolumeThreshold + TOL) {
    return 0;
  }

  const effectiveDivisor = isNonrect && rule.nonrectangularDivisor !== undefined
    ? rule.nonrectangularDivisor
    : rule.divisor;

  return effectiveVolume / effectiveDivisor;
}

function compare(a: number, d: number): 'actual' | 'dimensional' | 'equal' {
  if (Math.abs(a - d) <= TOL * Math.max(1, a, d)) return 'equal';
  return a > d ? 'actual' : 'dimensional';
}

export function calculateBillableWeight(pieces: PieceInput[], rule: DimRule): DimResult {
  const maxScale = rule.maxScaleWeight ?? rule.maxRatedWeight;

  const rows: PieceResult[] = pieces.map((p) => {
    const unroundedDimEach = dimensionalWeightOfPiece(p, rule);
    const dimEach = roundWeight(unroundedDimEach, rule.weightRounding);
    const actualEach = fromKg(toKg(p.weightEach, p.weightUnit), rule.divisorWeightUnit);
    const actual = actualEach * p.quantity;
    const unroundedDimensional = unroundedDimEach * p.quantity;
    const dimensional = dimEach * p.quantity;
    let billable: number;
    let basisWon = compare(actualEach, dimEach);

    if (rule.basis === 'piece') {
      const roundedActualEach = roundWeight(actualEach, rule.weightRounding);
      const pieceGoverning = Math.max(roundedActualEach, dimEach);
      const pieceIsOverweight = maxScale !== undefined && actualEach > maxScale;

      let cappedPiece: number;
      if (pieceIsOverweight) {
        // Physical piece exceeds carrier service limit: do not silently cap at 70 lb
        cappedPiece = pieceGoverning;
      } else if (rule.maxRatedWeight !== undefined && pieceGoverning > rule.maxRatedWeight) {
        // Legitimate dimensional-weight pricing cap: physical scale weight is eligible (<= maxScale),
        // but dimensional weight exceeds the pricing cap
        cappedPiece = rule.maxRatedWeight;
      } else {
        cappedPiece = pieceGoverning;
      }
      billable = cappedPiece * p.quantity;
    } else {
      billable = Math.max(actual, dimensional); // evaluated at shipment level below
      basisWon = compare(actual, dimensional);
    }
    return { quantity: p.quantity, actual, unroundedDimensional, dimensional, billable, basisWon };
  });

  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalUnroundedDimensional = rows.reduce((s, r) => s + r.unroundedDimensional, 0);
  const totalDimensional = rule.basis === 'piece'
    ? rows.reduce((s, r) => s + r.dimensional, 0)
    : roundWeight(totalUnroundedDimensional, rule.weightRounding);

  const isOverweight = maxScale !== undefined && (
    totalActual > maxScale || pieces.some((p) => fromKg(toKg(p.weightEach, p.weightUnit), rule.divisorWeightUnit) > maxScale)
  );

  let billable: number;
  let basisWon: 'actual' | 'dimensional' | 'equal';

  if (rule.basis === 'piece') {
    billable = rows.reduce((s, r) => s + r.billable, 0);
    basisWon = compare(totalActual, totalDimensional);
  } else {
    const roundedTotalActual = roundWeight(totalActual, rule.weightRounding);
    const rawBillable = Math.max(roundedTotalActual, totalDimensional);

    if (isOverweight) {
      billable = rawBillable;
    } else if (rule.maxRatedWeight !== undefined && rawBillable > rule.maxRatedWeight) {
      billable = rule.maxRatedWeight;
    } else {
      billable = rawBillable;
    }
    basisWon = compare(totalActual, totalDimensional);
  }

  return {
    rule,
    rows,
    totalActual,
    totalUnroundedDimensional,
    totalDimensional,
    billable,
    basisWon,
    weightUnit: rule.divisorWeightUnit,
    isOverweight,
  };
}

export function describeBasis(r: DimResult): string {
  if (r.isOverweight) {
    const limit = r.rule.maxScaleWeight ?? r.rule.maxRatedWeight ?? 70;
    return `Actual scale weight (${fmt(r.totalActual, 'weight')} ${r.weightUnit}) exceeds the ${limit} ${r.weightUnit} service limit (USPS DMM 101.3.1 / 123.1.2 / 223.1.2). Package is ineligible for standard service.`;
  }
  if (r.rule.minVolumeThreshold !== undefined && r.totalDimensional === 0) {
    return 'Dimensional weight does not apply (package volume is at or below the 1,728 in³ / 1 cu ft threshold). Actual weight governs the weight calculation, while postage may still use service-specific weight increments.';
  }
  if (r.rule.maxRatedWeight !== undefined && r.totalDimensional > r.rule.maxRatedWeight) {
    return `Calculated dimensional weight (${fmt(r.totalDimensional, 'weight')} ${r.weightUnit}) exceeds the ${r.rule.maxRatedWeight} ${r.weightUnit} maximum pricing tier. Per USPS DMM standards, postage is billed at the ${r.rule.maxRatedWeight}-${r.weightUnit} price.`;
  }
  if (r.basisWon === 'equal') return 'Actual weight and dimensional weight are equal.';
  return r.basisWon === 'actual'
    ? 'Actual weight is greater than dimensional weight.'
    : 'Dimensional weight is greater than actual weight.';
}
