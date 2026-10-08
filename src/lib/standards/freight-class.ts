/**
 * Density-based freight class ESTIMATE using the 13-sub density structure
 * (NMFTA/FCDC). Not an official NMFC item classification.
 * Bands are centralized here. Lower bound inclusive, upper bound exclusive (lb/ft³).
 * Source details live in the source registry (key: nmfta-density-structure).
 */
export interface DensityBand {
  /** inclusive lower bound, lb/ft³ */
  min: number;
  /** exclusive upper bound, lb/ft³ (Infinity for the top band) */
  max: number;
  freightClass: number;
}

export const DENSITY_BANDS: readonly DensityBand[] = [
  { min: 0, max: 1, freightClass: 400 },
  { min: 1, max: 2, freightClass: 300 },
  { min: 2, max: 4, freightClass: 250 },
  { min: 4, max: 6, freightClass: 175 },
  { min: 6, max: 8, freightClass: 125 },
  { min: 8, max: 10, freightClass: 100 },
  { min: 10, max: 12, freightClass: 92.5 },
  { min: 12, max: 15, freightClass: 85 },
  { min: 15, max: 22.5, freightClass: 70 },
  { min: 22.5, max: 30, freightClass: 65 },
  { min: 30, max: 35, freightClass: 60 },
  { min: 35, max: 50, freightClass: 55 },
  { min: 50, max: Infinity, freightClass: 50 },
] as const;

/** Deliberate floating-point tolerance for boundary comparisons. */
export const DENSITY_TOLERANCE = 1e-7;

/**
 * Normalizes density with deliberate tolerance.
 * Snaps values within tolerance of known band boundaries to avoid floating-point representation flips.
 */
export function normalizeDensity(densityPcf: number): number {
  for (const b of DENSITY_BANDS) {
    if (Math.abs(densityPcf - b.min) <= DENSITY_TOLERANCE) {
      return b.min;
    }
  }
  return densityPcf;
}

export function estimateFreightClass(densityPcf: number): { band: DensityBand; freightClass: number } {
  if (!Number.isFinite(densityPcf) || densityPcf < 0) {
    throw new RangeError('Density must be a finite number of 0 or greater.');
  }
  const d = normalizeDensity(densityPcf);
  const band = DENSITY_BANDS.find((b) => d >= b.min && d < b.max) ?? DENSITY_BANDS[DENSITY_BANDS.length - 1];
  return { band, freightClass: band.freightClass };
}

