import { describe, expect, it } from 'vitest';
import { packFloor } from './floor';
import { stackLayers, type Placement3D } from './layers';
import { planPallet, type PalletInput } from '../pallet';
import { loadContainer, palletsPerContainer, type ContainerSpec } from '../container';
import { planTrailerFloor } from '../trailer-floor';

type Box = { x: number; y: number; z: number; l: number; w: number; h: number };

function overlaps(a: Box, b: Box) {
  return a.x < b.x + b.l && b.x < a.x + a.l && a.y < b.y + b.w && b.y < a.y + a.w && a.z < b.z + b.h && b.z < a.z + a.h;
}
/** O(n²) is fine for test sizes; uses sorting sweep on x to stay fast for ~1000 boxes. */
function assertNoOverlap(boxes: Box[]) {
  const s = [...boxes].sort((a, b) => a.x - b.x);
  for (let i = 0; i < s.length; i++) {
    for (let j = i + 1; j < s.length && s[j].x < s[i].x + s[i].l; j++) {
      if (overlaps(s[i], s[j])) throw new Error(`overlap: ${JSON.stringify(s[i])} vs ${JSON.stringify(s[j])}`);
    }
  }
}
function assertInBounds(boxes: Box[], x0: number, y0: number, z0: number, x1: number, y1: number, z1: number) {
  for (const b of boxes) {
    expect(b.l).toBeGreaterThan(0);
    expect(b.w).toBeGreaterThan(0);
    expect(b.h).toBeGreaterThan(0);
    expect(b.x).toBeGreaterThanOrEqual(x0);
    expect(b.y).toBeGreaterThanOrEqual(y0);
    expect(b.z).toBeGreaterThanOrEqual(z0);
    expect(b.x + b.l).toBeLessThanOrEqual(x1);
    expect(b.y + b.w).toBeLessThanOrEqual(y1);
    expect(b.z + b.h).toBeLessThanOrEqual(z1);
  }
}
/** every placement must be a permutation of the item dims */
function assertOrientationValid(ps: Placement3D[], item: [number, number, number], upright: boolean, rotateFloor: boolean) {
  const sorted = [...item].sort((a, b) => a - b).join(',');
  for (const p of ps) {
    expect([p.l, p.w, p.h].sort((a, b) => a - b).join(',')).toBe(sorted);
    if (upright) {
      expect(p.h).toBe(item[2]);
      if (!rotateFloor) {
        expect(p.l).toBe(item[0]);
        expect(p.w).toBe(item[1]);
      }
    }
  }
}

describe('packFloor (2D)', () => {
  it('matches the simple grid for an exact fit', () => {
    const r = packFloor(1200, 800, [{ l: 400, w: 200, label: 'a' }]);
    expect(r.count).toBe(12);
  });
  it('rotation beats a single orientation (classic 3×2 vs 2×3 case)', () => {
    const one = packFloor(1000, 1000, [{ l: 300, w: 200, label: 'a' }]);
    const two = packFloor(1000, 1000, [
      { l: 300, w: 200, label: 'a' },
      { l: 200, w: 300, label: 'b' },
    ]);
    expect(one.count).toBe(15); // 3 × 5
    expect(two.count).toBeGreaterThanOrEqual(one.count);
  });
  it('mixed orientation beats uniform grid on awkward sizes', () => {
    // 1200×1000 bin, item 300×190: guillotine mix can exceed uniform rows
    const fps = [
      { l: 300, w: 190, label: 'a' },
      { l: 190, w: 300, label: 'b' },
    ];
    const uniform = Math.max(Math.floor(1200 / 300) * Math.floor(1000 / 190), Math.floor(1200 / 190) * Math.floor(1000 / 300));
    const r = packFloor(1200, 1000, fps);
    expect(r.count).toBeGreaterThanOrEqual(uniform);
  });
  it('returns zero when nothing fits', () => {
    expect(packFloor(100, 100, [{ l: 200, w: 50, label: 'a' }]).count).toBe(0);
  });
  it('structural validity on many sizes', () => {
    const items: [number, number][] = [[400, 300], [297, 203], [600, 400], [1200, 800], [333, 222], [250, 250], [1016, 1219]];
    const bins: [number, number][] = [[1200, 1000], [1016, 1219], [5896, 2350], [12032, 2350], [2400, 13600]];
    for (const [a, b] of items)
      for (const [bx, by] of bins) {
        const fps = [
          { l: a, w: b, label: 'a' },
          { l: b, w: a, label: 'b' },
        ];
        const r = packFloor(bx, by, fps);
        const boxes = r.placements.map((p) => ({ x: p.x, y: p.y, z: 0, l: p.l, w: p.w, h: 1 }));
        assertNoOverlap(boxes);
        assertInBounds(boxes, 0, 0, 0, bx, by, 1);
        expect(r.count).toBe(r.placements.length);
        // never worse than the best uniform grid
        const uni = Math.max(Math.floor(bx / a) * Math.floor(by / b), Math.floor(bx / b) * Math.floor(by / a));
        expect(r.count).toBeGreaterThanOrEqual(uni);
        // cannot exceed the area bound
        expect(r.count * a * b).toBeLessThanOrEqual(bx * by);
      }
  });
  it('is deterministic', () => {
    const fps = [{ l: 297, w: 203, label: 'a' }, { l: 203, w: 297, label: 'b' }];
    expect(packFloor(5896, 2350, fps)).toEqual(packFloor(5896, 2350, fps));
  });
});

describe('stackLayers (3D)', () => {
  it('upright, no rotation: simple grid × layers', () => {
    const r = stackLayers({ binX: 1200, binY: 800, binZ: 1000, item: [400, 200, 250], upright: true, rotateFloor: false });
    expect(r.count).toBe(3 * 4 * 4);
    assertNoOverlap(r.placements);
  });
  it('maxItems truncates and conserves count', () => {
    const r = stackLayers({ binX: 1200, binY: 800, binZ: 1000, item: [400, 200, 250], upright: true, rotateFloor: false, maxItems: 20 });
    expect(r.count).toBe(20);
    expect(r.placements.length).toBe(20);
    expect(r.capacity).toBe(48);
  });
  it('maxLayers = 1 gives a single layer', () => {
    const r = stackLayers({ binX: 1200, binY: 800, binZ: 2000, item: [400, 200, 250], upright: true, rotateFloor: false, maxLayers: 1 });
    expect(r.layers.length).toBe(1);
    expect(r.count).toBe(12);
  });
  it('height boundary: one below / equal / one above', () => {
    const run = (z: number) => stackLayers({ binX: 400, binY: 200, binZ: z, item: [400, 200, 250], upright: true, rotateFloor: false }).count;
    expect(run(499)).toBe(1);
    expect(run(500)).toBe(2);
    expect(run(501)).toBe(2);
    expect(run(249)).toBe(0);
    expect(run(250)).toBe(1);
  });
  it('free orientation can beat upright-only when height is awkward', () => {
    const up = stackLayers({ binX: 1000, binY: 1000, binZ: 1000, item: [400, 300, 450], upright: true, rotateFloor: true });
    const free = stackLayers({ binX: 1000, binY: 1000, binZ: 1000, item: [400, 300, 450], upright: false, rotateFloor: true });
    expect(free.count).toBeGreaterThanOrEqual(up.count);
  });
  it('gap is respected between items', () => {
    const r = stackLayers({ binX: 1000, binY: 100, binZ: 100, item: [100, 100, 100], upright: true, rotateFloor: false, gap: 10 });
    // 9 items need 9×100 + 8×10 = 980 ≤ 1000; a 10th would need 1090
    expect(r.count).toBe(9);
    assertNoOverlap(r.placements);
    for (let i = 1; i < r.placements.length; i++) expect(r.placements[i].x - (r.placements[i - 1].x + r.placements[i - 1].l)).toBeGreaterThanOrEqual(10);
  });
  it('door constraint removes orientations that do not fit through the door', () => {
    const open = stackLayers({ binX: 2000, binY: 1000, binZ: 1000, item: [500, 400, 300], upright: false, rotateFloor: true });
    const doored = stackLayers({ binX: 2000, binY: 1000, binZ: 1000, item: [500, 400, 300], upright: false, rotateFloor: true, door: { width: 350, height: 450 } });
    expect(doored.count).toBeLessThanOrEqual(open.count);
    for (const p of doored.placements) {
      expect(p.w).toBeLessThanOrEqual(350);
      expect(p.h).toBeLessThanOrEqual(450);
    }
  });
});

const GMA = { l: 1219, w: 1016 };
const palletBase = (o: Partial<PalletInput> = {}): PalletInput => ({
  carton: { l: 400, w: 300, h: 250, weightKg: 10 },
  quantity: 200,
  pallet: { l: 1200, w: 1000, deck: 150, tareKg: 20, maxPayloadKg: 1000, maxHeight: 1800 },
  upright: true,
  rotateFloor: true,
  edgeClearance: 0,
  overhang: 0,
  stackable: true,
  topClearance: 0,
  ...o,
});

describe('planPallet', () => {
  it('produces a structurally valid layout', () => {
    const r = planPallet(palletBase());
    expect(r.cartonsPerPallet).toBeGreaterThan(0);
    const boxes = r.placements.map((p) => ({ ...p }));
    assertNoOverlap(boxes);
    assertInBounds(boxes, r.region.x0, r.region.y0, 0, r.region.x1, r.region.y1, 1800 - 150);
    assertOrientationValid(r.placements, [400, 300, 250], true, true);
    expect(r.placements.length).toBe(r.cartonsPerPallet);
    expect(r.ti * r.hi).toBeLessThanOrEqual(r.cartonsPerPallet);
  });
  it('1200×1000 with 400×300×250: 10 per layer with rotation, 6 layers under 1800 mm', () => {
    const r = planPallet(palletBase({ pallet: { l: 1200, w: 1000, deck: 150, tareKg: 20, maxPayloadKg: null, maxHeight: 1800 } }));
    expect(r.ti).toBe(10);
    expect(r.hi).toBe(6);
    expect(r.cartonsPerPallet).toBe(60);
    expect(r.capacityLimit).toBe('height');
  });
  it('payload boundary: one below / equal / one above', () => {
    // 60 cartons × 10 kg = 600 kg
    const run = (payload: number) => planPallet(palletBase({ pallet: { l: 1200, w: 1000, deck: 150, tareKg: 20, maxPayloadKg: payload, maxHeight: 1800 } }));
    const below = run(599);
    expect(below.cartonsPerPallet).toBe(59);
    expect(below.capacityLimit).toBe('payload');
    const eq = run(600);
    expect(eq.cartonsPerPallet).toBe(60);
    expect(eq.capacityLimit).toBe('height');
    const above = run(601);
    expect(above.cartonsPerPallet).toBe(60);
    for (const r of [below, eq, above]) expect(r.cargoWeightKg).toBeLessThanOrEqual(r.cartonsPerPallet * 10 + 1e-9);
    expect(eq.remainingPayloadKg).toBe(0);
    expect(eq.cargoWeightKg).toBeLessThanOrEqual(600);
  });
  it('height boundary: one mm below / equal / above', () => {
    const run = (h: number) => planPallet(palletBase({ pallet: { l: 1200, w: 1000, deck: 150, tareKg: 20, maxPayloadKg: null, maxHeight: h } }));
    expect(run(150 + 1499).hi).toBe(5);
    expect(run(150 + 1500).hi).toBe(6);
    expect(run(150 + 1501).hi).toBe(6);
    expect(run(150 + 1500).loadedHeight).toBe(1650);
  });
  it('pallet count and final pallet quantity conserve the order', () => {
    const r = planPallet(palletBase({ quantity: 130, pallet: { l: 1200, w: 1000, deck: 150, tareKg: 20, maxPayloadKg: null, maxHeight: 1800 } }));
    expect(r.palletsRequired).toBe(3);
    expect(r.cartonsOnFinalPallet).toBe(10);
    expect((r.palletsRequired - 1) * r.cartonsPerPallet + r.cartonsOnFinalPallet).toBe(130);
  });
  it('whole order on one pallet reports quantity as the limit', () => {
    const r = planPallet(palletBase({ quantity: 20 }));
    expect(r.palletsRequired).toBe(1);
    expect(r.cartonsOnFinalPallet).toBe(20);
    expect(r.limit).toBe('quantity');
    expect(r.cartonsPerPallet).toBe(r.placements.length);
  });
  it('not stackable gives one layer and footprint limit', () => {
    const r = planPallet(palletBase({ stackable: false }));
    expect(r.hi).toBe(1);
    expect(r.capacityLimit === 'footprint' || r.capacityLimit === 'payload').toBe(true);
  });
  it('overhang increases usable footprint, edge clearance decreases it', () => {
    const base = planPallet(palletBase({ stackable: false })).ti;
    const over = planPallet(palletBase({ stackable: false, overhang: 100 })).ti;
    const clear = planPallet(palletBase({ stackable: false, edgeClearance: 100 })).ti;
    expect(over).toBeGreaterThanOrEqual(base);
    expect(clear).toBeLessThanOrEqual(base);
  });
  it('visible errors instead of silent clamps', () => {
    expect(planPallet(palletBase({ carton: { l: 2000, w: 300, h: 250, weightKg: 1 } })).issues.length).toBe(1);
    expect(planPallet(palletBase({ carton: { l: 400, w: 300, h: 250, weightKg: 5000 } })).issues.length).toBe(1);
  });
  it('GMA pallet is deterministic', () => {
    const i = palletBase({ pallet: { l: GMA.l, w: GMA.w, deck: 140, tareKg: 18, maxPayloadKg: 1200, maxHeight: 1700 } });
    expect(planPallet(i)).toEqual(planPallet(i));
  });
});

const C20: ContainerSpec = { name: '20 ft', length: 5896, width: 2350, height: 2393, doorWidth: 2340, doorHeight: 2280, maxPayloadKg: 28000 };
const C40HC: ContainerSpec = { name: '40 ft HC', length: 12032, width: 2350, height: 2697, doorWidth: 2340, doorHeight: 2580, maxPayloadKg: 28000 };
const cbase = (o: Record<string, unknown> = {}) => ({
  container: C20,
  cargo: { l: 600, w: 400, h: 400, weightKg: 10, quantity: 100000, packageType: 'carton' },
  upright: false,
  rotateFloor: true,
  wallClearance: 0,
  handlingGap: 0,
  useDoorConstraint: false,
  ...o,
});

describe('loadContainer', () => {
  it('structural validity', () => {
    const r = loadContainer(cbase({ cargo: { l: 600, w: 400, h: 400, weightKg: 10, quantity: 1000, packageType: 'carton' } }) as never);
    const boxes = r.placements.map((p) => ({ ...p }));
    assertNoOverlap(boxes);
    assertInBounds(boxes, 0, 0, 0, C20.length, C20.width, C20.height);
    assertOrientationValid(r.placements, [600, 400, 400], false, true);
    expect(r.loaded).toBe(r.placements.length);
    expect(r.loaded + r.remaining).toBe(1000);
    expect(r.cubeUtilization).toBeLessThanOrEqual(1);
  });
  it('is never worse than naive per-axis division and respects volume', () => {
    const r = loadContainer(cbase() as never);
    const naive = Math.floor(5896 / 600) * Math.floor(2350 / 400) * Math.floor(2393 / 400);
    expect(r.geometricCapacity).toBeGreaterThanOrEqual(naive);
    expect(r.loaded * 600 * 400 * 400).toBeLessThanOrEqual(5896 * 2350 * 2393);
  });
  it('payload boundary: one below / equal / above', () => {
    const run = (payload: number) =>
      loadContainer(cbase({ container: { ...C20, maxPayloadKg: payload }, cargo: { l: 600, w: 400, h: 400, weightKg: 10, quantity: 100000, packageType: 'carton' } }) as never);
    const cap = run(1e6).loaded;
    expect(cap).toBeGreaterThan(100);
    const eq = run(cap * 10);
    expect(eq.loaded).toBe(cap);
    expect(eq.weightKg).toBeLessThanOrEqual(cap * 10);
    const below = run(cap * 10 - 1);
    expect(below.loaded).toBe(cap - 1);
    expect(below.limit).toBe('payload');
    expect(below.weightKg).toBeLessThanOrEqual(cap * 10 - 1);
    const above = run(cap * 10 + 1);
    expect(above.loaded).toBe(cap);
    expect(above.limit).not.toBe('payload');
  });
  it('quantity smaller than capacity loads everything', () => {
    const r = loadContainer(cbase({ cargo: { l: 600, w: 400, h: 400, weightKg: 10, quantity: 50, packageType: 'carton' } }) as never);
    expect(r.loaded).toBe(50);
    expect(r.remaining).toBe(0);
    expect(r.limit).toBe('quantity');
    expect(r.containersRequired).toBe(1);
    expect(r.recommendedCapacity).toBeGreaterThan(50);
    expect(r.geometricCapacity).toBeGreaterThan(50);
  });
  it('calculates containers required and recommended capacity consistently', () => {
    // Piece: 1170 × 580 × 590 mm in C20 (5896 × 2350 × 2393 mm).
    // Floor: floor(5896/1170)=5 * floor(2350/580)=4 = 20.
    // Layers: floor(2393/590)=4 layers -> 80 pieces.
    // Order of 170 pieces -> loads 80 in first container, 90 remaining, 3 containers required.
    const r = loadContainer(
      cbase({
        cargo: { l: 1170, w: 580, h: 590, weightKg: 10, quantity: 170, packageType: 'carton' },
        upright: true,
        rotateFloor: false,
      }) as never,
    );
    expect(r.geometricCapacity).toBe(80);
    expect(r.recommendedCapacity).toBe(80);
    expect(r.loaded).toBe(80);
    expect(r.remaining).toBe(90);
    expect(r.containersRequired).toBe(3);
    expect(r.containersRequired).toBe(Math.ceil(170 / r.loaded));
  });
  it('upright-only never exceeds free orientation', () => {
    const up = loadContainer(cbase({ upright: true }) as never);
    const free = loadContainer(cbase({ upright: false }) as never);
    expect(free.loaded).toBeGreaterThanOrEqual(up.loaded);
  });
  it('wall clearance reduces capacity', () => {
    const a = loadContainer(cbase() as never).loaded;
    const b = loadContainer(cbase({ wallClearance: 50 }) as never).loaded;
    expect(b).toBeLessThanOrEqual(a);
  });
  it('40ft HC holds more than 20ft', () => {
    const a = loadContainer(cbase() as never).loaded;
    const b = loadContainer(cbase({ container: C40HC }) as never).loaded;
    expect(b).toBeGreaterThan(a);
  });
  it('door constraint is respected', () => {
    const r = loadContainer(cbase({ useDoorConstraint: true, container: { ...C20, doorWidth: 450, doorHeight: 450 } }) as never);
    for (const p of r.placements) {
      expect(p.w).toBeLessThanOrEqual(450);
      expect(p.h).toBeLessThanOrEqual(450);
    }
  });
  it('is deterministic', () => {
    const i = cbase({ cargo: { l: 297, w: 203, h: 151, weightKg: 3, quantity: 5000, packageType: 'carton' } }) as never;
    expect(loadContainer(i)).toEqual(loadContainer(i));
  });
  it('errors when the piece is too large', () => {
    const r = loadContainer(cbase({ cargo: { l: 9000, w: 400, h: 400, weightKg: 10, quantity: 1, packageType: 'carton' } }) as never);
    expect(r.loaded).toBe(0);
    expect(r.issues.length).toBe(1);
  });
});

describe('palletsPerContainer', () => {
  it('20ft fits 11 Euro pallets (1200×800) on the floor with rotation', () => {
    const r = palletsPerContainer({ container: C20, pallet: { l: 1200, w: 800, h: 1200, weightKg: 500 }, rotate: true, wallClearance: 0, palletGap: 0, maxTiers: 1 });
    expect(r.perFloor).toBeGreaterThanOrEqual(11);
    const boxes = r.placements.map((p) => ({ x: p.x, y: p.y, z: 0, l: p.l, w: p.w, h: 1 }));
    assertNoOverlap(boxes);
    assertInBounds(boxes, 0, 0, 0, C20.length, C20.width, 1);
    expect(r.stackedTotal).toBe(r.perFloor);
  });
  it('stacking is reported separately and limited by height', () => {
    const r = palletsPerContainer({ container: C40HC, pallet: { l: 1200, w: 1000, h: 1000, weightKg: null }, rotate: true, wallClearance: 0, palletGap: 0, maxTiers: 5 });
    expect(r.tiers).toBe(2); // 2697 / 1000
    expect(r.stackedTotal).toBe(r.perFloor * 2);
  });
  it('rotation is never worse', () => {
    const a = palletsPerContainer({ container: C20, pallet: { l: 1219, w: 1016, h: 1200, weightKg: null }, rotate: false, wallClearance: 0, palletGap: 0, maxTiers: 1 });
    const b = palletsPerContainer({ container: C20, pallet: { l: 1219, w: 1016, h: 1200, weightKg: null }, rotate: true, wallClearance: 0, palletGap: 0, maxTiers: 1 });
    expect(b.perFloor).toBeGreaterThanOrEqual(a.perFloor);
  });
});

describe('planTrailerFloor', () => {
  const base = { item: { l: 1219, w: 1016, h: 1200 }, quantity: 26, trailerWidth: 2438, trailerLength: 16154, stackLevels: 1, trailerHeight: null, rotate: true };
  it('fits and conserves positions', () => {
    const r = planTrailerFloor(base);
    expect(r.fits).toBe(true);
    expect(r.placedPositions).toBe(26);
    const boxes = r.placements.map((p) => ({ x: p.x, y: p.y, z: 0, l: p.l, w: p.w, h: 1 }));
    assertNoOverlap(boxes);
    assertInBounds(boxes, 0, 0, 0, r.lengthUsed, 2438, 1);
  });
  it('stacking halves floor positions', () => {
    const a = planTrailerFloor({ ...base, quantity: 20 });
    const b = planTrailerFloor({ ...base, quantity: 20, stackLevels: 2 });
    expect(b.floorPositions).toBe(10);
    expect(b.lengthUsed).toBeLessThan(a.lengthUsed);
  });
  it('euro pallets: 33 pallets fill roughly 13.6 m trailer with rotation', () => {
    const r = planTrailerFloor({ item: { l: 1200, w: 800, h: 1000 }, quantity: 33, trailerWidth: 2400, trailerLength: 13600, stackLevels: 1, trailerHeight: null, rotate: true });
    expect(r.fits).toBe(true);
    expect(r.lengthUsed).toBeLessThanOrEqual(13600);
  });
  it('too many pallets reports unplaced units', () => {
    const r = planTrailerFloor({ ...base, quantity: 100, trailerLength: 5000 });
    expect(r.fits).toBe(false);
    expect(r.unplacedUnits).toBeGreaterThan(0);
    expect(r.lengthUsed).toBeLessThanOrEqual(5000);
  });
  it('errors when too wide', () => {
    const r = planTrailerFloor({ ...base, trailerWidth: 900, rotate: false });
    expect(r.issues.length).toBe(1);
  });
});
