import { stackLayers, type LayerInfo, type Placement3D } from './packing/layers';
import { packFloor, type FloorPlacement } from './packing/floor';

/** All inputs in millimetres / kilograms. */
export interface ContainerSpec {
  name: string;
  length: number;
  width: number;
  height: number;
  doorWidth: number | null;
  doorHeight: number | null;
  /** cargo payload limit, null = not limited */
  maxPayloadKg: number | null;
}

export interface ContainerInput {
  container: ContainerSpec;
  cargo: { l: number; w: number; h: number; weightKg: number; quantity: number; packageType: string };
  upright: boolean;
  rotateFloor: boolean;
  /** clearance kept free on each wall / roof */
  wallClearance: number;
  /** extra space between neighbouring pieces */
  handlingGap: number;
  useDoorConstraint: boolean;
  /** limit on stacked layers (1 = no stacking) */
  maxLayers?: number;
}

export type ContainerLimit = 'quantity' | 'payload' | 'door opening' | 'orientation' | 'floor geometry' | 'height' | 'volume';

export interface ContainerResult {
  loaded: number;
  remaining: number;
  placements: Placement3D[];
  layers: LayerInfo[];
  usable: { l: number; w: number; h: number };
  usedHeight: number;
  usedLength: number;
  cubeUtilization: number; // cargo volume / internal container volume
  usableCubeUtilization: number;
  weightKg: number;
  weightUtilization: number | null; // vs payload
  geometricCapacity: number;
  payloadCapacity: number | null;
  limit: ContainerLimit;
  reducedSearch: boolean;
  unusedVolumeM3: number;
  issues: string[];
}

const r = (v: number) => Math.round(v);

export function loadContainer(i: ContainerInput): ContainerResult {
  const c = i.container;
  const usable = { l: r(c.length - 2 * i.wallClearance), w: r(c.width - 2 * i.wallClearance), h: r(c.height - i.wallClearance) };
  const issues: string[] = [];
  const empty = (msg: string): ContainerResult => ({
    loaded: 0,
    remaining: i.cargo.quantity,
    placements: [],
    layers: [],
    usable,
    usedHeight: 0,
    usedLength: 0,
    cubeUtilization: 0,
    usableCubeUtilization: 0,
    weightKg: 0,
    weightUtilization: c.maxPayloadKg ? 0 : null,
    geometricCapacity: 0,
    payloadCapacity: null,
    limit: 'floor geometry',
    reducedSearch: false,
    unusedVolumeM3: (c.length * c.width * c.height) / 1e9,
    issues: [msg],
  });
  if (usable.l <= 0 || usable.w <= 0 || usable.h <= 0) return empty('The wall clearance is larger than the container. Reduce the clearance.');
  const item: [number, number, number] = [r(i.cargo.l), r(i.cargo.w), r(i.cargo.h)];
  const itemVol = (item[0] + i.handlingGap) * (item[1] + i.handlingGap) * (item[2] + i.handlingGap);
  if ((usable.l * usable.w * usable.h) / itemVol > 200_000)
    return empty('The cargo piece is extremely small compared with the container. Check the dimensions and unit, or plan by pallet or master carton.');

  const door = i.useDoorConstraint && c.doorWidth && c.doorHeight ? { width: r(c.doorWidth - 2 * 0), height: r(c.doorHeight) } : null;
  const payloadCap = c.maxPayloadKg === null ? null : Math.floor(c.maxPayloadKg / i.cargo.weightKg + 1e-9);
  if (payloadCap !== null && payloadCap < 1)
    return empty('One piece exceeds the container payload limit. Reduce the piece weight or raise the payload limit.');

  const base = {
    binX: usable.l,
    binY: usable.w,
    binZ: usable.h,
    item,
    upright: i.upright,
    rotateFloor: i.rotateFloor,
    gap: r(i.handlingGap),
    maxLayers: i.maxLayers,
  };
  const geo = stackLayers({ ...base, door });
  if (geo.capacity === 0) {
    return empty(
      door
        ? 'No allowed orientation fits through the door opening and inside the container. Turn off the door constraint or allow other orientations.'
        : 'The cargo piece does not fit inside the usable container space. Check the dimensions, clearance and orientation rules.',
    );
  }
  const cap = Math.min(geo.capacity, payloadCap ?? Infinity, i.cargo.quantity);
  const drawn = stackLayers({ ...base, door, maxItems: cap });

  // limiting constraint
  let limit: ContainerLimit;
  if (drawn.count >= i.cargo.quantity) limit = 'quantity';
  else if (payloadCap !== null && payloadCap < geo.capacity) limit = 'payload';
  else {
    const relaxedDoor = door ? stackLayers({ ...base, door: null }).capacity : geo.capacity;
    const relaxedOrient = !i.upright || !i.rotateFloor ? stackLayers({ ...base, door, upright: false, rotateFloor: true }).capacity : geo.capacity;
    if (door && relaxedDoor > geo.capacity) limit = 'door opening';
    else if ((i.upright || !i.rotateFloor) && relaxedOrient > geo.capacity) limit = 'orientation';
    else {
      const avgFloor = geo.layers.length ? geo.layers.reduce((s, l) => s + l.floorUtilization, 0) / geo.layers.length : 0;
      const slackH = usable.h - geo.usedHeight;
      if (avgFloor < 0.85) limit = 'floor geometry';
      else if (slackH / usable.h > 0.05) limit = 'height';
      else limit = 'volume';
    }
  }

  const internalVolumeMm3 = c.length * c.width * c.height;
  const usableVolumeMm3 = usable.l * usable.w * usable.h;
  const weightKg = drawn.count * i.cargo.weightKg;
  const usedLength = drawn.placements.reduce((m, p) => Math.max(m, p.x + p.l), 0);
  return {
    loaded: drawn.count,
    remaining: i.cargo.quantity - drawn.count,
    placements: drawn.placements,
    layers: drawn.layers,
    usable,
    usedHeight: drawn.usedHeight,
    usedLength,
    cubeUtilization: drawn.usedVolume / internalVolumeMm3,
    usableCubeUtilization: drawn.usedVolume / usableVolumeMm3,
    weightKg,
    weightUtilization: c.maxPayloadKg ? weightKg / c.maxPayloadKg : null,
    geometricCapacity: geo.capacity,
    payloadCapacity: payloadCap,
    limit,
    reducedSearch: geo.reducedSearch,
    unusedVolumeM3: (internalVolumeMm3 - drawn.usedVolume) / 1e9,
    issues,
  };
}

/* ------------------------------------------------------------------ */
/* Pallets per container: already-loaded pallets, 2D floor packing      */
/* ------------------------------------------------------------------ */

export interface PalletsInContainerInput {
  container: ContainerSpec;
  pallet: { l: number; w: number; h: number; weightKg: number | null };
  rotate: boolean;
  wallClearance: number;
  /** gap between neighbouring pallets */
  palletGap: number;
  /** tiers allowed (1 = no stacking) — reported separately */
  maxTiers: number;
}

export interface PalletsInContainerResult {
  perFloor: number;
  placements: FloorPlacement[];
  usable: { l: number; w: number };
  floorUtilization: number; // pallet footprint area / container floor area
  usableFloorUtilization: number;
  remainingFloorAreaM2: number;
  /** tiers that physically fit by height (limited by maxTiers) */
  tiers: number;
  stackedTotal: number;
  /** stacked total after payload cap, if weight and payload are known */
  stackedTotalWeightLimited: number | null;
  floorOrientationCounts: { label: string; count: number }[];
  reducedSearch: boolean;
  issues: string[];
}

export function palletsPerContainer(i: PalletsInContainerInput): PalletsInContainerResult {
  const c = i.container;
  const g = r(i.palletGap);
  const usable = { l: r(c.length - 2 * i.wallClearance), w: r(c.width - 2 * i.wallClearance) };
  const usableH = r(c.height - i.wallClearance);
  const base: PalletsInContainerResult = {
    perFloor: 0,
    placements: [],
    usable,
    floorUtilization: 0,
    usableFloorUtilization: 0,
    remainingFloorAreaM2: (c.length * c.width) / 1e6,
    tiers: 0,
    stackedTotal: 0,
    stackedTotalWeightLimited: null,
    floorOrientationCounts: [],
    reducedSearch: false,
    issues: [],
  };
  if (usable.l <= 0 || usable.w <= 0) return { ...base, issues: ['The wall clearance is larger than the container floor. Reduce the clearance.'] };
  const L = r(i.pallet.l);
  const W = r(i.pallet.w);
  const fps = [{ l: L + g, w: W + g, label: 'Length along container length' }];
  if (i.rotate && L !== W) fps.push({ l: W + g, w: L + g, label: 'Length across container width' });
  const res = packFloor(usable.l + g, usable.w + g, fps);
  // placements keep their true (gap-free) sizes
  const placements = res.placements.map((p) => ({ ...p, l: p.l - g, w: p.w - g }));
  const area = placements.reduce((s, p) => s + p.l * p.w, 0);
  const counts = fps.map((f, idx) => ({ label: f.label, count: placements.filter((p) => p.footprint === idx).length })).filter((x) => x.count > 0);
  const heightTiers = Math.floor((usableH + g) / (r(i.pallet.h) + g));
  const tiers = Math.max(0, Math.min(i.maxTiers, heightTiers));
  let weightLimited: number | null = null;
  if (i.pallet.weightKg && c.maxPayloadKg) {
    weightLimited = Math.min(placements.length * tiers, Math.floor(c.maxPayloadKg / i.pallet.weightKg + 1e-9));
  }
  return {
    perFloor: placements.length,
    placements,
    usable,
    floorUtilization: area / (c.length * c.width),
    usableFloorUtilization: area / (usable.l * usable.w),
    remainingFloorAreaM2: (c.length * c.width - area) / 1e6,
    tiers,
    stackedTotal: placements.length * tiers,
    stackedTotalWeightLimited: weightLimited,
    floorOrientationCounts: counts,
    reducedSearch: res.reducedSearch,
    issues: [],
  };
}
