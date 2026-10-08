/**
 * 2D rectangle packing of identical items into a rectangular bin.
 *
 * Method: guillotine-cut dynamic programming over "raster points"
 * (positions reachable as non-negative integer combinations of item sides).
 * It exactly maximises the count among guillotine-cut arrangements of the allowed
 * footprints. It does NOT consider non-guillotine layouts (e.g. pinwheel), so results are
 * "best tested arrangement", not a proof of global optimality.
 *
 * All values are integers in millimetres. Fully deterministic.
 */

export interface Footprint {
  /** extent along X */
  l: number;
  /** extent along Y */
  w: number;
  /** label for the orientation, e.g. "L×W" */
  label: string;
}

export interface FloorPlacement {
  x: number;
  y: number;
  l: number;
  w: number;
  footprint: number; // index into the footprints array
}

export interface FloorResult {
  count: number;
  placements: FloorPlacement[];
  /** area covered by items / bin area */
  utilization: number;
  /** true if the DP was skipped for size and a simpler search was used */
  reducedSearch: boolean;
}

/** Above this estimated work the exact guillotine DP is replaced by a simpler deterministic search. */
const MAX_DP_OPS = 6e6;

function raster(limit: number, sides: number[]): number[] {
  const set = new Uint8Array(limit + 1);
  set[0] = 1;
  for (let v = 1; v <= limit; v++) {
    for (const s of sides) {
      if (v - s >= 0 && set[v - s]) {
        set[v] = 1;
        break;
      }
    }
  }
  const out: number[] = [];
  for (let v = 0; v <= limit; v++) if (set[v]) out.push(v);
  return out;
}

type Choice =
  | { t: 'grid'; fp: number; nx: number; ny: number }
  | { t: 'v'; at: number }
  | { t: 'h'; at: number }
  | { t: 'none' };

const floorCache = new Map<string, FloorResult>();

/** Memoized: packing is a pure function of (bin, footprints), so caching cannot change results. */
export function packFloor(binX: number, binY: number, footprints: Footprint[], maxCount = Infinity): FloorResult {
  const key = `${binX}x${binY}|${footprints.map((f) => `${f.l}x${f.w}`).join(',')}`;
  let full = floorCache.get(key);
  if (!full) {
    full = packFloorCore(binX, binY, footprints);
    if (floorCache.size > 300) floorCache.clear();
    floorCache.set(key, full);
  }
  if (!Number.isFinite(maxCount) || maxCount >= full.count) return full;
  const kept = full.placements.slice(0, Math.max(0, maxCount));
  const area = kept.reduce((s, p) => s + p.l * p.w, 0);
  return { count: kept.length, placements: kept, utilization: area / (binX * binY), reducedSearch: full.reducedSearch };
}

function packFloorCore(binX: number, binY: number, footprints: Footprint[], maxCount = Infinity): FloorResult {
  const empty: FloorResult = { count: 0, placements: [], utilization: 0, reducedSearch: false };
  if (footprints.length === 0 || binX <= 0 || binY <= 0) return empty;
  const fps = footprints;
  const xs = raster(binX, fps.map((f) => f.l));
  const ys = raster(binY, fps.map((f) => f.w));
  const reduceX = (x: number) => {
    // largest raster value <= x (binary search)
    let lo = 0,
      hi = xs.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (xs[mid] <= x) lo = mid;
      else hi = mid - 1;
    }
    return xs[lo];
  };
  const reduceY = (y: number) => {
    let lo = 0,
      hi = ys.length - 1;
    while (lo < hi) {
      const mid = (lo + hi + 1) >> 1;
      if (ys[mid] <= y) lo = mid;
      else hi = mid - 1;
    }
    return ys[lo];
  };

  const gridBest = (x: number, y: number): { count: number; choice: Choice } => {
    let best = 0;
    let choice: Choice = { t: 'none' };
    fps.forEach((f, i) => {
      const nx = Math.floor(x / f.l);
      const ny = Math.floor(y / f.w);
      const c = nx * ny;
      if (c > best) {
        best = c;
        choice = { t: 'grid', fp: i, nx, ny };
      }
    });
    return { count: best, choice };
  };

  const ops = xs.length * ys.length * (xs.length + ys.length);
  const reduced = ops > MAX_DP_OPS;
  const memo = new Map<number, { count: number; choice: Choice }>();
  const key = (x: number, y: number) => x * 1_000_003 + y;

  const solve = (x0: number, y0: number): { count: number; choice: Choice } => {
    const x = reduceX(x0);
    const y = reduceY(y0);
    const k = key(x, y);
    const hit = memo.get(k);
    if (hit) return hit;
    let { count: best, choice } = gridBest(x, y);
    if (!reduced) {
      for (const p of xs) {
        if (p <= 0 || p >= x) continue;
        const c = solve(p, y).count + solve(x - p, y).count;
        if (c > best) {
          best = c;
          choice = { t: 'v', at: p };
        }
      }
      for (const p of ys) {
        if (p <= 0 || p >= y) continue;
        const c = solve(x, p).count + solve(x, y - p).count;
        if (c > best) {
          best = c;
          choice = { t: 'h', at: p };
        }
      }
    }
    const res = { count: best, choice };
    memo.set(k, res);
    return res;
  };

  if (reduced) {
    // Fallback: best uniform grid, or one vertical / horizontal cut of two uniform grids.
    let best = gridBest(binX, binY);
    for (const p of xs) {
      if (p <= 0 || p >= binX) continue;
      const c = gridBest(p, binY).count + gridBest(binX - p, binY).count;
      if (c > best.count) best = { count: c, choice: { t: 'v', at: p } };
    }
    for (const p of ys) {
      if (p <= 0 || p >= binY) continue;
      const c = gridBest(binX, p).count + gridBest(binX, binY - p).count;
      if (c > best.count) best = { count: c, choice: { t: 'h', at: p } };
    }
    memo.set(key(reduceX(binX), reduceY(binY)), best);
  } else {
    solve(binX, binY);
  }

  const placements: FloorPlacement[] = [];
  const emit = (ox: number, oy: number, x0: number, y0: number) => {
    if (!reduced) {
      x0 = reduceX(x0);
      y0 = reduceY(y0);
    }
    const res = reduced
      ? ((): { count: number; choice: Choice } => {
          // reduced mode: only top-level result is cached, sub-blocks are uniform grids
          return gridBest(x0, y0);
        })()
      : solve(x0, y0);
    const choice = res.choice;
    if (choice.t === 'grid') {
      const f = fps[choice.fp];
      for (let i = 0; i < choice.nx; i++)
        for (let j = 0; j < choice.ny; j++)
          placements.push({ x: ox + i * f.l, y: oy + j * f.w, l: f.l, w: f.w, footprint: choice.fp });
    } else if (choice.t === 'v') {
      emit(ox, oy, choice.at, y0);
      emit(ox + choice.at, oy, x0 - choice.at, y0);
    } else if (choice.t === 'h') {
      emit(ox, oy, x0, choice.at);
      emit(ox, oy + choice.at, x0, y0 - choice.at);
    }
  };
  if (reduced) {
    const top = memo.get(key(reduceX(binX), reduceY(binY)))!;
    const c = top.choice;
    if (c.t === 'v') {
      emit(0, 0, c.at, binY);
      emit(c.at, 0, binX - c.at, binY);
    } else if (c.t === 'h') {
      emit(0, 0, binX, c.at);
      emit(0, c.at, binX, binY - c.at);
    } else emit(0, 0, binX, binY);
  } else emit(0, 0, binX, binY);

  // deterministic order: by x, then y
  placements.sort((a, b) => a.x - b.x || a.y - b.y || a.footprint - b.footprint);
  const kept = Number.isFinite(maxCount) ? placements.slice(0, Math.max(0, maxCount)) : placements;
  const area = kept.reduce((s, p) => s + p.l * p.w, 0);
  return { count: kept.length, placements: kept, utilization: area / (binX * binY), reducedSearch: reduced };
}
