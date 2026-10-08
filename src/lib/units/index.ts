/** Shared unit engine. Canonical units: metre, kilogram, cubic metre. */

export type LengthUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';
export type WeightUnit = 'g' | 'kg' | 'lb' | 'tonne';
export type VolumeUnit = 'mm3' | 'cm3' | 'm3' | 'in3' | 'ft3' | 'litre';

/** Metres per unit (inch and foot are exact by definition). */
export const METRES_PER: Record<LengthUnit, number> = {
  mm: 0.001,
  cm: 0.01,
  m: 1,
  in: 0.0254,
  ft: 0.3048,
};

/** Kilograms per unit (pound is exact by definition). */
export const KG_PER: Record<WeightUnit, number> = {
  g: 0.001,
  kg: 1,
  lb: 0.45359237,
  tonne: 1000,
};

/** Cubic metres per unit. */
export const M3_PER: Record<VolumeUnit, number> = {
  mm3: 1e-9,
  cm3: 1e-6,
  m3: 1,
  in3: 0.0254 ** 3,
  ft3: 0.3048 ** 3,
  litre: 0.001,
};

export const LENGTH_LABEL: Record<LengthUnit, string> = { mm: 'mm', cm: 'cm', m: 'm', in: 'in', ft: 'ft' };
export const WEIGHT_LABEL: Record<WeightUnit, string> = { g: 'g', kg: 'kg', lb: 'lb', tonne: 't' };
export const VOLUME_LABEL: Record<VolumeUnit, string> = {
  mm3: 'mm³',
  cm3: 'cm³',
  m3: 'm³',
  in3: 'in³',
  ft3: 'ft³',
  litre: 'L',
};

export const toMetres = (v: number, u: LengthUnit) => v * METRES_PER[u];
export const fromMetres = (m: number, u: LengthUnit) => m / METRES_PER[u];
export const toKg = (v: number, u: WeightUnit) => v * KG_PER[u];
export const fromKg = (kg: number, u: WeightUnit) => kg / KG_PER[u];
export const toM3 = (v: number, u: VolumeUnit) => v * M3_PER[u];
export const fromM3 = (m3: number, u: VolumeUnit) => m3 / M3_PER[u];

export const convertLength = (v: number, from: LengthUnit, to: LengthUnit) =>
  fromMetres(toMetres(v, from), to);
export const convertWeight = (v: number, from: WeightUnit, to: WeightUnit) => fromKg(toKg(v, from), to);
export const convertVolume = (v: number, from: VolumeUnit, to: VolumeUnit) => fromM3(toM3(v, from), to);

/** Volume of a box given dimensions in a single length unit, returned in m³. */
export function boxVolumeM3(l: number, w: number, h: number, unit: LengthUnit): number {
  return toMetres(l, unit) * toMetres(w, unit) * toMetres(h, unit);
}
