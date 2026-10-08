export interface LclRow {
  cbm: number;
  weightKg: number;
}

export interface LclOptions {
  /** rate per W/M unit, user-entered */
  rate?: number | null;
  /** minimum chargeable W/M, user-entered */
  minimumWm?: number | null;
  /** fixed fees, user-entered */
  fixedFees?: number | null;
}

export interface LclResult {
  totalCbm: number;
  totalWeightKg: number;
  weightTonnes: number;
  /** max(CBM, tonnes) */
  wm: number;
  basis: 'measure' | 'weight' | 'equal';
  chargeableWm: number;
  minimumApplied: boolean;
  baseFreight: number | null;
  fixedFees: number | null;
  total: number | null;
}

const TOL = 1e-9;

/** W/M = max(CBM, weight in tonnes). Revenue ton convention: 1 tonne = 1 m³ for planning. */
export function calculateLcl(rows: LclRow[], opts: LclOptions = {}): LclResult {
  for (const r of rows) {
    if (!Number.isFinite(r.cbm) || r.cbm < 0 || !Number.isFinite(r.weightKg) || r.weightKg < 0) {
      throw new RangeError('Row CBM and weight must be non-negative finite numbers.');
    }
  }
  if (opts.rate !== undefined && opts.rate !== null && (!Number.isFinite(opts.rate) || opts.rate < 0)) {
    throw new RangeError('Rate must be a non-negative finite number.');
  }
  if (opts.minimumWm !== undefined && opts.minimumWm !== null && (!Number.isFinite(opts.minimumWm) || opts.minimumWm < 0)) {
    throw new RangeError('Minimum W/M must be a non-negative finite number.');
  }
  if (opts.fixedFees !== undefined && opts.fixedFees !== null && (!Number.isFinite(opts.fixedFees) || opts.fixedFees < 0)) {
    throw new RangeError('Fixed fees must be a non-negative finite number.');
  }
  const totalCbm = rows.reduce((s, r) => s + r.cbm, 0);
  const totalWeightKg = rows.reduce((s, r) => s + r.weightKg, 0);
  const weightTonnes = totalWeightKg / 1000;
  const wm = Math.max(totalCbm, weightTonnes);
  const basis: LclResult['basis'] =
    Math.abs(totalCbm - weightTonnes) <= TOL * Math.max(1, totalCbm, weightTonnes)
      ? 'equal'
      : totalCbm > weightTonnes
        ? 'measure'
        : 'weight';
  const min = opts.minimumWm ?? null;
  const minimumApplied = min !== null && min > wm;
  const chargeableWm = minimumApplied ? (min as number) : wm;
  const rate = opts.rate ?? null;
  const baseFreight = rate !== null ? chargeableWm * rate : null;
  const fixedFees = opts.fixedFees ?? null;
  const total = baseFreight !== null ? baseFreight + (fixedFees ?? 0) : null;
  return { totalCbm, totalWeightKg, weightTonnes, wm, basis, chargeableWm, minimumApplied, baseFreight, fixedFees, total };
}
