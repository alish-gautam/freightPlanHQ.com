/** Locale-safe, fixed-precision formatting. Precision is defined per quantity, never ad hoc. */
export const PRECISION = {
  count: 0,
  length: 1,
  lengthFine: 2,
  weight: 2,
  cbm: 3,
  volume: 3,
  density: 2,
  percent: 1,
  ratio: 2,
  money: 2,
  freightClass: 1,
} as const;

export type PrecisionKey = keyof typeof PRECISION;

const cache = new Map<number, Intl.NumberFormat>();
function nf(d: number) {
  let f = cache.get(d);
  if (!f) {
    f = new Intl.NumberFormat('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });
    cache.set(d, f);
  }
  return f;
}

/** Format with a fixed number of decimals. Never returns "-0". */
export function fixed(n: number, decimals: number): string {
  if (!Number.isFinite(n)) return '—';
  const s = nf(decimals).format(Math.abs(n) < 0.5 * 10 ** -decimals ? 0 : n);
  return s;
}

export const fmt = (n: number, kind: PrecisionKey) => fixed(n, PRECISION[kind]);

/** Value with its unit, always shown together. */
export const withUnit = (n: number, kind: PrecisionKey, unit: string) => `${fmt(n, kind)} ${unit}`;

export const pct = (ratio: number) => `${fixed(ratio * 100, PRECISION.percent)}%`;

/** Freight class labels: 92.5 keeps one decimal, whole classes show no decimals. */
export const classLabel = (c: number) => (Number.isInteger(c) ? String(c) : c.toFixed(1));

export function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}
