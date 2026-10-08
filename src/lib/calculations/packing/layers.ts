import { packFloor, type Footprint } from './floor';

/**
 * Layer-decomposition 3D packing of identical rectangular items.
 *
 * 1. Enumerate allowed orientations (which axis is vertical, optional 90° floor rotation).
 * 2. For each vertical axis, pack one floor layer with packFloor (2D guillotine DP).
 * 3. Choose the best sequence of layers (each layer may use a different vertical axis) by
 *    dynamic programming over height: maximise item count, then minimise used height.
 *
 * Deterministic, no randomness. Result is a "best tested arrangement", not a proof of
 * global 3D optimality.
 * All values are integers in millimetres.
 */

export const AXIS_NAMES = ['L', 'W', 'H'] as const;

export interface StackInput {
  /** usable bin extents */
  binX: number;
  binY: number;
  binZ: number;
  /** item dimensions [L, W, H] */
  item: [number, number, number];
  /** true: item height stays vertical (only floor rotation allowed) */
  upright: boolean;
  /** allow 90° rotation on the floor */
  rotateFloor: boolean;
  /** space added between neighbouring items on every axis */
  gap?: number;
  /** maximum number of layers (1 = no stacking) */
  maxLayers?: number;
  /** stop at this many items (quantity / payload cap) */
  maxItems?: number;
  /** door cross-section constraint (Y extent and Z extent of each item must fit) */
  door?: { width: number; height: number } | null;
}

export interface Placement3D {
  x: number;
  y: number;
  z: number;
  l: number;
  w: number;
  h: number;
  /** e.g. "L along X, W along Y, H vertical" */
  orientation: string;
  layer: number;
}

export interface LayerInfo {
  index: number;
  z: number;
  height: number;
  count: number;
  orientation: string;
  /** footprint utilisation of this layer on the bin */
  floorUtilization: number;
}

export interface StackResult {
  count: number;
  /** count before maxItems truncation */
  capacity: number;
  placements: Placement3D[];
  layers: LayerInfo[];
  usedHeight: number;
  /** count of items in the bottom layer */
  bottomLayerCount: number;
  usedVolume: number;
  reducedSearch: boolean;
}

interface OrientationLayer {
  verticalAxis: number;
  height: number; // expanded
  realHeight: number;
  count: number;
  placements: ReturnType<typeof packFloor>['placements'];
  fps: (Footprint & { realL: number; realW: number; axes: [number, number] })[];
  label: string;
  utilization: number;
}

const orientLabel = (x: number, y: number, z: number) =>
  `${AXIS_NAMES[x]} along X, ${AXIS_NAMES[y]} along Y, ${AXIS_NAMES[z]} vertical`;

export function stackLayers(inp: StackInput): StackResult {
  const gap = inp.gap ?? 0;
  const dims = inp.item;
  const verticals = inp.upright ? [2] : [2, 1, 0];
  const layers: OrientationLayer[] = [];
  let reducedSearch = false;
  const seen = new Set<string>();

  for (const v of verticals) {
    const others = [0, 1, 2].filter((a) => a !== v);
    const axisPairs: [number, number][] = [[others[0], others[1]]];
    if (inp.rotateFloor) axisPairs.push([others[1], others[0]]);
    const fps: OrientationLayer['fps'] = [];
    for (const [ax, ay] of axisPairs) {
      const realL = dims[ax];
      const realW = dims[ay];
      const realH = dims[v];
      if (inp.door && (realW > inp.door.width || realH > inp.door.height)) continue;
      fps.push({ l: realL + gap, w: realW + gap, realL, realW, axes: [ax, ay], label: orientLabel(ax, ay, v) });
    }
    if (fps.length === 0) continue;
    // de-duplicate orientations that are identical in extents
    const sig = `${dims[v]}|${fps.map((f) => `${f.l}x${f.w}`).sort().join(',')}`;
    if (seen.has(sig)) continue;
    seen.add(sig);
    const hExp = dims[v] + gap;
    if (hExp > inp.binZ + gap) continue;
    const res = packFloor(inp.binX + gap, inp.binY + gap, fps);
    if (res.reducedSearch) reducedSearch = true;
    if (res.count === 0) continue;
    layers.push({
      verticalAxis: v,
      height: hExp,
      realHeight: dims[v],
      count: res.count,
      placements: res.placements,
      fps,
      label: fps[0].label,
      utilization: res.placements.reduce((s, p) => s + (p.l - gap) * (p.w - gap), 0) / (inp.binX * inp.binY),
    });
  }

  const empty: StackResult = {
    count: 0,
    capacity: 0,
    placements: [],
    layers: [],
    usedHeight: 0,
    bottomLayerCount: 0,
    usedVolume: 0,
    reducedSearch,
  };
  if (layers.length === 0) return empty;

  const Z = inp.binZ + gap;
  const minH = Math.min(...layers.map((l) => l.height));
  if (minH <= 0 || !Number.isFinite(minH) || Z <= 0) return empty;
  const kMax = Math.min(inp.maxLayers ?? Infinity, Math.floor(Z / minH));
  if (kMax < 1) return empty;

  // f[k][h]: best (count, usedHeight) with at most k layers in available height h
  type Cell = { c: number; u: number; from: number; prevH: number };
  const f: Cell[][] = [];
  for (let k = 0; k <= kMax; k++) {
    f.push(new Array<Cell>(Z + 1).fill(null as unknown as Cell));
    for (let h = 0; h <= Z; h++) f[k][h] = { c: 0, u: 0, from: -1, prevH: h };
  }
  for (let k = 1; k <= kMax; k++) {
    for (let h = 0; h <= Z; h++) {
      let best: Cell = { ...f[k - 1][h], from: -1, prevH: h }; // fewer layers
      layers.forEach((L, idx) => {
        if (L.height > h) return;
        const prev = f[k - 1][h - L.height];
        const c = prev.c + L.count;
        const u = prev.u + L.height;
        if (c > best.c || (c === best.c && u < best.u)) best = { c, u, from: idx, prevH: h - L.height };
      });
      f[k][h] = best;
    }
  }

  // reconstruct sequence (bottom → top order is the reverse of the reconstruction)
  const seq: number[] = [];
  let k = kMax;
  let h = Z;
  while (k > 0) {
    const cell = f[k][h];
    if (cell.from === -1) {
      // same as f[k-1][h]
      k--;
      continue;
    }
    seq.push(cell.from);
    h = cell.prevH;
    k--;
  }
  // put layers with higher counts at the bottom (stable, deterministic)
  seq.sort((a, b) => layers[b].count - layers[a].count || a - b);

  const capacity = seq.reduce((s, i) => s + layers[i].count, 0);
  const maxItems = Math.min(inp.maxItems ?? Infinity, capacity);
  const placements: Placement3D[] = [];
  const layerInfos: LayerInfo[] = [];
  let z = 0;
  let placed = 0;
  for (let li = 0; li < seq.length && placed < maxItems; li++) {
    const L = layers[seq[li]];
    const take = Math.min(L.count, maxItems - placed);
    for (let i = 0; i < take; i++) {
      const p = L.placements[i];
      const fp = L.fps[p.footprint];
      placements.push({
        x: p.x,
        y: p.y,
        z,
        l: fp.realL,
        w: fp.realW,
        h: L.realHeight,
        orientation: fp.label,
        layer: li,
      });
    }
    layerInfos.push({
      index: li,
      z,
      height: L.realHeight,
      count: take,
      orientation: L.fps[L.placements[0].footprint].label,
      floorUtilization: take === L.count ? L.utilization : L.placements.slice(0, take).reduce((s, p) => s + (p.l - gap) * (p.w - gap), 0) / (inp.binX * inp.binY),
    });
    placed += take;
    z += L.height;
  }
  const lastLayer = layerInfos[layerInfos.length - 1];
  const usedHeight = lastLayer ? lastLayer.z + lastLayer.height : 0;
  const usedVolume = placements.reduce((s, p) => s + p.l * p.w * p.h, 0);
  return {
    count: placed,
    capacity,
    placements,
    layers: layerInfos,
    usedHeight,
    bottomLayerCount: layerInfos[0]?.count ?? 0,
    usedVolume,
    reducedSearch,
  };
}
