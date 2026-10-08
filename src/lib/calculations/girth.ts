import { fromMetres, toMetres, type LengthUnit } from '../units';

export interface ThresholdSpec {
  value: number;
  unit: LengthUnit;
  target?: 'lengthPlusGirth' | 'length';
}

export interface GirthResult {
  /** longest dimension, in the user's unit */
  length: number;
  width: number;
  height: number;
  girth: number;
  lengthPlusGirth: number;
  unit: LengthUnit;
  threshold: number | null;
  thresholdTarget: 'lengthPlusGirth' | 'length' | null;
  /** positive = under the threshold, negative = over */
  margin: number | null;
  withinThreshold: boolean | null;
}

/** Length = longest side; girth = 2 × (other two sides). Threshold can evaluate length+girth or length alone. */
export function calculateGirth(
  dims: [number, number, number],
  unit: LengthUnit,
  threshold?: ThresholdSpec | null,
): GirthResult {
  const [length, width, height] = [...dims].sort((a, b) => b - a);
  const girth = 2 * (width + height);
  const lengthPlusGirth = length + girth;
  let t: number | null = null;
  let margin: number | null = null;
  let within: boolean | null = null;
  const target = threshold?.target ?? 'lengthPlusGirth';
  if (threshold) {
    t = fromMetres(toMetres(threshold.value, threshold.unit), unit);
    const measured = target === 'length' ? length : lengthPlusGirth;
    margin = t - measured;
    within = measured <= t + 1e-9;
  }
  return {
    length,
    width,
    height,
    girth,
    lengthPlusGirth,
    unit,
    threshold: t,
    thresholdTarget: threshold ? target : null,
    margin,
    withinThreshold: within,
  };
}
