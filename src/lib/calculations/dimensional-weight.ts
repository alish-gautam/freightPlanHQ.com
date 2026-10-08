import { fromKg, toKg, toMetres, fromMetres, type LengthUnit, type WeightUnit } from '../units';

export interface PieceInput {
  length: number;
  width: number;
  height: number;
  unit: LengthUnit;
  quantity: number;
  /** actual gross weight of ONE piece */
  weightEach: number;
  weightUnit: WeightUnit;
}

export type WeightRounding = 'none' | 'half' | 'whole';
export type DimBasis = 'shipment' | 'piece';

export interface DimRule {
  /** volume per weight unit, e.g. 5000 (cm³/kg) or 139 (in³/lb) */
  divisor: number;
  /** length unit in which the divisor's volume is expressed */
  divisorLengthUnit: 'cm' | 'in';
  /** weight unit in which the result is expressed */
  divisorWeightUnit: 'kg' | 'lb';
  /** Round each dimension UP to a whole number of the divisor's length unit before multiplying */
  roundDimensionsUp: boolean;
  weightRounding: WeightRounding;
  basis: DimBasis;
}

export interface PieceResult {
  quantity: number;
  actual: number; // in rule weight unit, total for the row
  dimensional: number; // in rule weight unit, total for the row
  billable: number;
  basisWon: 'actual' | 'dimensional' | 'equal';
}

export interface DimResult {
  rule: DimRule;
  rows: PieceResult[];
  /** all in rule.divisorWeightUnit */
  totalActual: number;
  totalDimensional: number;
  billable: number;
  basisWon: 'actual' | 'dimensional' | 'equal';
  weightUnit: 'kg' | 'lb';
}

const TOL = 1e-9;

export function roundWeight(w: number, mode: WeightRounding): number {
  if (mode === 'none') return w;
  const step = mode === 'half' ? 0.5 : 1;
  return Math.ceil(w / step - TOL) * step;
}

function dimsInRuleUnit(p: PieceInput, rule: DimRule): [number, number, number] {
  return [p.length, p.width, p.height].map((d) => {
    const v = fromMetres(toMetres(d, p.unit), rule.divisorLengthUnit);
    return rule.roundDimensionsUp ? Math.ceil(v - TOL) : v;
  }) as [number, number, number];
}

export function dimensionalWeightOfPiece(p: PieceInput, rule: DimRule): number {
  const [l, w, h] = dimsInRuleUnit(p, rule);
  return (l * w * h) / rule.divisor;
}

function compare(a: number, d: number): 'actual' | 'dimensional' | 'equal' {
  if (Math.abs(a - d) <= TOL * Math.max(1, a, d)) return 'equal';
  return a > d ? 'actual' : 'dimensional';
}

export function calculateBillableWeight(pieces: PieceInput[], rule: DimRule): DimResult {
  const rows: PieceResult[] = pieces.map((p) => {
    const dimEach = dimensionalWeightOfPiece(p, rule);
    const actualEach = fromKg(toKg(p.weightEach, p.weightUnit), rule.divisorWeightUnit);
    const actual = actualEach * p.quantity;
    const dimensional = dimEach * p.quantity;
    let billable: number;
    let basisWon = compare(actualEach, dimEach);
    if (rule.basis === 'piece') {
      billable = roundWeight(Math.max(actualEach, dimEach), rule.weightRounding) * p.quantity;
    } else {
      billable = Math.max(actual, dimensional); // rounded at shipment level below
      basisWon = compare(actual, dimensional);
    }
    return { quantity: p.quantity, actual, dimensional, billable, basisWon };
  });
  const totalActual = rows.reduce((s, r) => s + r.actual, 0);
  const totalDimensional = rows.reduce((s, r) => s + r.dimensional, 0);
  let billable: number;
  let basisWon: 'actual' | 'dimensional' | 'equal';
  if (rule.basis === 'piece') {
    billable = rows.reduce((s, r) => s + r.billable, 0);
    basisWon = compare(totalActual, totalDimensional);
  } else {
    billable = roundWeight(Math.max(totalActual, totalDimensional), rule.weightRounding);
    basisWon = compare(totalActual, totalDimensional);
  }
  return { rule, rows, totalActual, totalDimensional, billable, basisWon, weightUnit: rule.divisorWeightUnit };
}

export function describeBasis(r: DimResult): string {
  if (r.basisWon === 'equal') return 'Actual weight and dimensional weight are equal.';
  return r.basisWon === 'actual'
    ? 'Actual weight is greater than dimensional weight.'
    : 'Dimensional weight is greater than actual weight.';
}
