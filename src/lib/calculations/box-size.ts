import { fromMetres, toMetres, type LengthUnit } from '../units';

export interface BoxSizeInput {
  /** product dimensions, all in `unit` */
  length: number;
  width: number;
  height: number;
  unit: LengthUnit;
  quantity: number;
  /** clearance between product and box wall, each side */
  padding: number;
  /** gap between adjacent units (dividers) */
  dividerClearance: number;
  /** board thickness (one wall); outside = inside + 2 × board */
  boardThickness: number;
  /** allow all 6 rotations; false = product keeps its height axis vertical (2 floor orientations) */
  allowRotation: boolean;
}

export interface BoxSizeResult {
  /** grid counts along the box's x, y, z */
  grid: { nx: number; ny: number; nz: number };
  /** product orientation (dimensions along x, y, z) */
  orientation: [number, number, number];
  internal: [number, number, number];
  outside: [number, number, number];
  unit: LengthUnit;
  unitsPacked: number;
  emptySlots: number;
  productVolume: number; // in unit³ (all units combined)
  internalVolume: number;
  outsideVolume: number;
  cubeUtilization: number; // product volume / internal volume
  candidatesEvaluated: number;
}

export const MAX_BOX_QTY = 1000;

function orientations(l: number, w: number, h: number, all: boolean): [number, number, number][] {
  const out: [number, number, number][] = [
    [l, w, h],
    [w, l, h],
  ];
  if (all) {
    out.push([l, h, w], [h, l, w], [w, h, l], [h, w, l]);
  }
  // de-duplicate (cubes, equal sides) so ties are stable
  const seen = new Set<string>();
  return out.filter((o) => {
    const k = o.join('|');
    if (seen.has(k)) return false;
    seen.add(k);
    return true;
  });
}

/**
 * Rectangular-box planning model: unit grid nx × ny × nz of identical products.
 * Minimises internal volume; ties → smaller longest side, then lexicographic order (deterministic).
 */
export function recommendBox(i: BoxSizeInput): BoxSizeResult {
  if (!Number.isFinite(i.quantity) || i.quantity < 1 || !Number.isInteger(i.quantity) || i.quantity > MAX_BOX_QTY) {
    throw new RangeError(`Quantity must be an integer between 1 and ${MAX_BOX_QTY}.`);
  }
  if (
    !Number.isFinite(i.length) || i.length <= 0 ||
    !Number.isFinite(i.width) || i.width <= 0 ||
    !Number.isFinite(i.height) || i.height <= 0 ||
    !Number.isFinite(i.padding) || i.padding < 0 ||
    !Number.isFinite(i.dividerClearance) || i.dividerClearance < 0 ||
    !Number.isFinite(i.boardThickness) || i.boardThickness < 0
  ) {
    throw new RangeError('Dimensions must be positive finite numbers, and allowances must be non-negative finite numbers.');
  }
  const q = i.quantity;
  let best: { vol: number; maxSide: number; key: string; o: [number, number, number]; g: [number, number, number]; inner: [number, number, number] } | null = null;
  let evaluated = 0;
  for (const o of orientations(i.length, i.width, i.height, i.allowRotation)) {
    for (let nx = 1; nx <= q; nx++) {
      for (let ny = 1; ny <= q; ny++) {
        const nz = Math.ceil(q / (nx * ny));
        evaluated++;
        // skip grids that clearly waste a whole layer/row more than needed
        if (nx * ny * (nz - 1) >= q) continue;
        const inner: [number, number, number] = [
          nx * o[0] + (nx - 1) * i.dividerClearance + 2 * i.padding,
          ny * o[1] + (ny - 1) * i.dividerClearance + 2 * i.padding,
          nz * o[2] + (nz - 1) * i.dividerClearance + 2 * i.padding,
        ];
        const vol = inner[0] * inner[1] * inner[2];
        const maxSide = Math.max(...inner);
        const key = `${o.join(',')}|${nx},${ny},${nz}`;
        const better =
          !best ||
          vol < best.vol - 1e-9 ||
          (Math.abs(vol - best.vol) <= 1e-9 && (maxSide < best.maxSide - 1e-9 || (Math.abs(maxSide - best.maxSide) <= 1e-9 && key < best.key)));
        if (better) best = { vol, maxSide, key, o, g: [nx, ny, nz], inner };
      }
    }
  }
  const b = best!;
  const outside = b.inner.map((v) => v + 2 * i.boardThickness) as [number, number, number];
  const productVolume = q * i.length * i.width * i.height;
  const internalVolume = b.inner[0] * b.inner[1] * b.inner[2];
  const outsideVolume = outside[0] * outside[1] * outside[2];
  return {
    grid: { nx: b.g[0], ny: b.g[1], nz: b.g[2] },
    orientation: b.o,
    internal: b.inner,
    outside,
    unit: i.unit,
    unitsPacked: q,
    emptySlots: b.g[0] * b.g[1] * b.g[2] - q,
    productVolume,
    internalVolume,
    outsideVolume,
    cubeUtilization: productVolume / internalVolume,
    candidatesEvaluated: evaluated,
  };
}

export { fromMetres, toMetres };
