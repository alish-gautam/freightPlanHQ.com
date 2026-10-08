import { KG_PER, M3_PER, METRES_PER, toKg, toMetres, type LengthUnit, type VolumeUnit, type WeightUnit } from '../units';

export interface CargoRowInput {
  length: number;
  width: number;
  height: number;
  quantity: number;
  unit: LengthUnit;
  /** Gross weight of ONE piece (optional) */
  weightEach?: number | null;
  weightUnit?: WeightUnit;
}

export interface CargoRowResult {
  cbmEach: number;
  cbm: number;
  pieces: number;
  weightKg: number | null;
}

export interface CbmResult {
  rows: CargoRowResult[];
  totalCbm: number;
  totalPieces: number;
  /** null unless every row has a weight */
  totalWeightKg: number | null;
  densityKgM3: number | null;
  densityPcf: number | null;
}

/** CBM = L × W × H × quantity, dimensions normalized to metres first. */
export function calculateCbm(rows: CargoRowInput[]): CbmResult {
  const out: CargoRowResult[] = rows.map((r) => {
    const cbmEach = toMetres(r.length, r.unit) * toMetres(r.width, r.unit) * toMetres(r.height, r.unit);
    const weightKg =
      r.weightEach !== null && r.weightEach !== undefined && r.weightUnit
        ? toKg(r.weightEach, r.weightUnit) * r.quantity
        : null;
    return { cbmEach, cbm: cbmEach * r.quantity, pieces: r.quantity, weightKg };
  });
  const totalCbm = out.reduce((s, r) => s + r.cbm, 0);
  const totalPieces = out.reduce((s, r) => s + r.pieces, 0);
  const allWeighted = out.length > 0 && out.every((r) => r.weightKg !== null);
  const totalWeightKg = allWeighted ? out.reduce((s, r) => s + (r.weightKg as number), 0) : null;
  const d = totalWeightKg !== null && totalCbm > 0 ? densityFrom(totalWeightKg, totalCbm) : null;
  return {
    rows: out,
    totalCbm,
    totalPieces,
    totalWeightKg,
    densityKgM3: d ? d.kgM3 : null,
    densityPcf: d ? d.pcf : null,
  };
}

/** Density from weight (kg) and volume (m³). Returns kg/m³ and lb/ft³. */
export function densityFrom(weightKg: number, volumeM3: number): { kgM3: number; pcf: number } {
  if (!Number.isFinite(weightKg) || weightKg < 0) {
    throw new RangeError('Weight must be a non-negative finite number.');
  }
  if (!Number.isFinite(volumeM3) || volumeM3 <= 0) {
    throw new RangeError('Volume must be a finite number greater than 0.');
  }
  const kgM3 = weightKg / volumeM3;
  const pcf = weightKg / KG_PER.lb / (volumeM3 / M3_PER.ft3);
  return { kgM3, pcf };
}

export const kgM3ToPcf = (kgM3: number) => (kgM3 / KG_PER.lb) * M3_PER.ft3;
export const pcfToKgM3 = (pcf: number) => (pcf * KG_PER.lb) / M3_PER.ft3;

export interface BoxVolumeResult {
  /** volume of one box in each unit */
  each: Record<VolumeUnit, number>;
  total: Record<VolumeUnit, number>;
  quantity: number;
}

export function boxVolume(l: number, w: number, h: number, unit: LengthUnit, quantity = 1): BoxVolumeResult {
  const m3 = toMetres(l, unit) * toMetres(w, unit) * toMetres(h, unit);
  const each = {} as Record<VolumeUnit, number>;
  const total = {} as Record<VolumeUnit, number>;
  (Object.keys(M3_PER) as VolumeUnit[]).forEach((u) => {
    each[u] = m3 / M3_PER[u];
    total[u] = (m3 * quantity) / M3_PER[u];
  });
  return { each, total, quantity };
}

export { METRES_PER };
