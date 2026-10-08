import { packFloor, type FloorPlacement } from './packing/floor';

/**
 * Trailer floor-length planning for linear feet (U.S./Canada LTL) and loading metres (European road freight).
 * Both use the same layout core: pack footprints across the trailer width and find the shortest
 * floor length that holds the required number of floor positions. Inputs in mm.
 */
export interface TrailerFloorInput {
  item: { l: number; w: number; h: number };
  quantity: number;
  /** usable internal trailer width */
  trailerWidth: number;
  /** optional trailer length; null = no length limit */
  trailerLength: number | null;
  /** how many units may be stacked (1 = not stackable) */
  stackLevels: number;
  /** optional internal trailer height used to check stacking */
  trailerHeight: number | null;
  /** allow turning items 90° on the floor */
  rotate: boolean;
}

export interface TrailerFloorResult {
  /** floor positions needed = ceil(quantity / effectiveStack) */
  floorPositions: number;
  effectiveStack: number;
  stackNote: string | null;
  /** floor length used by the layout, mm */
  lengthUsed: number;
  /** area basis: occupied footprint area / trailer width, mm */
  areaBasisLength: number;
  rows: number;
  unitsPerRow: number;
  placements: FloorPlacement[];
  /** count actually placed (may be less than floorPositions when the trailer is too short) */
  placedPositions: number;
  unplacedUnits: number;
  fits: boolean;
  trailerUtilization: number | null; // lengthUsed / trailerLength
  floorAreaUtilization: number; // occupied footprint area / (trailerWidth × lengthUsed)
  orientationCounts: { label: string; count: number }[];
  reducedSearch: boolean;
  issues: string[];
}

export function planTrailerFloor(i: TrailerFloorInput): TrailerFloorResult {
  const L = Math.round(i.item.l);
  const W = Math.round(i.item.w);
  const width = Math.round(i.trailerWidth);
  const issues: string[] = [];
  const fps = [{ l: L, w: W, label: 'Length along trailer' }];
  if (i.rotate && L !== W) fps.push({ l: W, w: L, label: 'Turned 90°' });

  let stack = Math.max(1, Math.floor(i.stackLevels));
  let stackNote: string | null = null;
  if (i.trailerHeight !== null && stack > 1) {
    const byHeight = Math.floor(i.trailerHeight / i.item.h + 1e-9);
    if (byHeight < stack) {
      stackNote = `Only ${byHeight} stack level${byHeight === 1 ? '' : 's'} fit under the entered trailer height, so stacking was reduced from ${stack} to ${Math.max(1, byHeight)}.`;
      stack = Math.max(1, byHeight);
    }
  }
  const empty = (msg: string): TrailerFloorResult => ({
    floorPositions: 0,
    effectiveStack: stack,
    stackNote,
    lengthUsed: 0,
    areaBasisLength: 0,
    rows: 0,
    unitsPerRow: 0,
    placements: [],
    placedPositions: 0,
    unplacedUnits: i.quantity,
    fits: false,
    trailerUtilization: null,
    floorAreaUtilization: 0,
    orientationCounts: [],
    reducedSearch: false,
    issues: [msg],
  });
  if (!fps.some((f) => f.w <= width)) return empty('The item is wider than the usable trailer width in every allowed orientation. Allow 90° turning or check the dimensions.');

  const positions = Math.ceil(i.quantity / stack);
  const maxLen = i.trailerLength !== null ? Math.round(i.trailerLength) : Math.max(L, W) * positions + 1;

  // find the shortest length holding `positions` items by testing candidate lengths in ascending order
  const candidates = new Set<number>();
  for (let a = 0; a <= positions; a++)
    for (const f of fps) {
      const v = a * f.l;
      if (v > 0 && v <= maxLen) candidates.add(v);
    }
  const sorted = [...candidates].sort((a, b) => a - b);
  // two-footprint combos
  if (fps.length === 2) {
    const extra = new Set<number>();
    const lim = Math.min(positions, 60);
    for (let a = 0; a <= lim; a++) for (let b = 0; b <= lim; b++) {
      const v = a * fps[0].l + b * fps[1].l;
      if (v > 0 && v <= maxLen) extra.add(v);
    }
    for (const v of extra) if (!candidates.has(v)) sorted.push(v);
    sorted.sort((a, b) => a - b);
  }
  // binary search over sorted candidate lengths (count is monotonic in length)
  let lo = 0;
  let hi = sorted.length - 1;
  let found = -1;
  const countAt = (len: number) => packFloor(len, width, fps).count;
  if (sorted.length && countAt(sorted[hi]) >= positions) {
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (countAt(sorted[mid]) >= positions) {
        found = mid;
        hi = mid - 1;
      } else lo = mid + 1;
    }
  }
  let lengthBin: number;
  let fits = true;
  if (found >= 0) lengthBin = sorted[found];
  else {
    fits = false;
    lengthBin = maxLen;
  }
  const res = packFloor(lengthBin, width, fps, fits ? positions : Infinity);
  const placed = res.placements;
  const lengthUsed = placed.reduce((m, p) => Math.max(m, p.x + p.l), 0);
  const xs = new Map<number, number>();
  placed.forEach((p) => xs.set(p.x, (xs.get(p.x) ?? 0) + 1));
  const occupiedArea = placed.reduce((s, p) => s + p.l * p.w, 0);
  const counts = fps.map((f, idx) => ({ label: f.label, count: placed.filter((p) => p.footprint === idx).length })).filter((x) => x.count > 0);
  return {
    floorPositions: positions,
    effectiveStack: stack,
    stackNote,
    lengthUsed,
    areaBasisLength: (positions * L * W) / width,
    rows: xs.size,
    unitsPerRow: Math.max(0, ...xs.values()),
    placements: placed,
    placedPositions: placed.length,
    unplacedUnits: fits ? 0 : Math.max(0, i.quantity - placed.length * stack),
    fits,
    trailerUtilization: i.trailerLength !== null ? lengthUsed / i.trailerLength : null,
    floorAreaUtilization: lengthUsed > 0 ? occupiedArea / (width * lengthUsed) : 0,
    orientationCounts: counts,
    reducedSearch: res.reducedSearch,
    issues,
  };
}
