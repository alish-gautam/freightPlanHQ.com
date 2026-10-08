import { fixed } from '../../formatting';
import { fromMetres, toMetres, toKg, type LengthUnit, type WeightUnit } from '../../units';
import type { Option, RowValues, Values } from '../types';

export const LENGTH_OPTIONS: Option[] = [
  { value: 'mm', label: 'mm' },
  { value: 'cm', label: 'cm' },
  { value: 'm', label: 'm' },
  { value: 'in', label: 'in' },
  { value: 'ft', label: 'ft' },
];
export const WEIGHT_OPTIONS: Option[] = [
  { value: 'kg', label: 'kg' },
  { value: 'lb', label: 'lb' },
  { value: 'g', label: 'g' },
  { value: 'tonne', label: 't' },
];

export const num = (v: unknown): number | null => (typeof v === 'number' && Number.isFinite(v) ? v : null);
export const str = (v: unknown, d = ''): string => (typeof v === 'string' ? v : d);
export const bool = (v: unknown): boolean => v === true;
export const rows = (v: unknown): RowValues[] => (Array.isArray(v) ? (v as RowValues[]) : []);
export const lengthUnit = (v: unknown, d: LengthUnit = 'cm'): LengthUnit => (['mm', 'cm', 'm', 'in', 'ft'].includes(str(v)) ? (str(v) as LengthUnit) : d);
export const weightUnit = (v: unknown, d: WeightUnit = 'kg'): WeightUnit => (['g', 'kg', 'lb', 'tonne'].includes(str(v)) ? (str(v) as WeightUnit) : d);

/** value in unit → millimetres (not rounded) */
export const toMm = (v: number, u: LengthUnit) => toMetres(v, u) * 1000;
export const fromMm = (mm: number, u: LengthUnit) => fromMetres(mm / 1000, u);

const LEN_DECIMALS: Record<LengthUnit, number> = { mm: 0, cm: 1, m: 2, in: 1, ft: 2 };
export const lenLabel = (u: LengthUnit) => u;
export const fmtLen = (mm: number, u: LengthUnit) => `${fixed(fromMm(mm, u), LEN_DECIMALS[u])} ${u}`;
export const fmtLenPlain = (mm: number, u: LengthUnit) => fixed(fromMm(mm, u), LEN_DECIMALS[u]);
export const fmtKg = (kg: number, u: WeightUnit | 'kg' = 'kg') => {
  const v = u === 'kg' ? kg : kg / toKg(1, u);
  const unit = u === 'tonne' ? 't' : u;
  return `${fixed(v, u === 'tonne' ? 3 : 2)} ${unit}`;
};

export const NOT_NUMBER = 'Enter a number.';

export function pluralize(n: number, singular: string, plural = `${singular}s`) {
  return `${fixed(n, 0)} ${n === 1 ? singular : plural}`;
}

export type { Values };
