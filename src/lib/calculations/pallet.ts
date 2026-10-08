import { stackLayers, type Placement3D, type LayerInfo } from './packing/layers';

/** All inputs in millimetres / kilograms. */
export interface PalletInput {
  carton: { l: number; w: number; h: number; weightKg: number };
  quantity: number;
  pallet: {
    l: number;
    w: number;
    deck: number;
    tareKg: number;
    /** maximum cargo weight on the pallet, null = not limited */
    maxPayloadKg: number | null;
    /** maximum loaded height measured from the floor (includes the pallet deck) */
    maxHeight: number;
  };
  upright: boolean;
  rotateFloor: boolean;
  /** inset from each pallet edge */
  edgeClearance: number;
  /** allowed overhang beyond each pallet edge (explicitly supplied by the user) */
  overhang: number;
  stackable: boolean;
  /** reserve kept free above the top layer */
  topClearance: number;
}

export type PalletLimit = 'footprint' | 'height' | 'payload' | 'quantity';

export interface PalletResult {
  /** cartons on a full pallet (best layout found, after payload cap) */
  cartonsPerPallet: number;
  geometricCapacity: number;
  payloadCapacity: number | null;
  ti: number;
  hi: number;
  palletsRequired: number;
  cartonsOnFinalPallet: number;
  /** layout actually drawn: one full pallet (count = cartonsPerPallet) */
  placements: Placement3D[];
  layers: LayerInfo[];
  /** origin offset of the usable region relative to pallet corner (can be negative with overhang) */
  region: { x0: number; y0: number; x1: number; y1: number };
  loadedHeight: number;
  remainingHeight: number;
  cargoWeightKg: number;
  tareKg: number;
  grossWeightKg: number;
  remainingPayloadKg: number | null;
  footprintUtilization: number;
  volumeUtilization: number;
  /** what limits a FULL pallet */
  capacityLimit: Exclude<PalletLimit, 'quantity'>;
  /** the limit that applies to this order (quantity if the whole order fits on one pallet) */
  limit: PalletLimit;
  reducedSearch: boolean;
  issues: string[];
}

export const MAX_ITEMS_GUARD = 200_000;

const toInt = (v: number) => Math.round(v);

export function planPallet(i: PalletInput): PalletResult {
  const issues: string[] = [];
  const x0 = i.edgeClearance - i.overhang;
  const y0 = i.edgeClearance - i.overhang;
  const usableX = toInt(i.pallet.l + 2 * i.overhang - 2 * i.edgeClearance);
  const usableY = toInt(i.pallet.w + 2 * i.overhang - 2 * i.edgeClearance);
  const usableZ = toInt(i.pallet.maxHeight - i.pallet.deck - i.topClearance);
  const item: [number, number, number] = [toInt(i.carton.l), toInt(i.carton.w), toInt(i.carton.h)];

  const empty = (msg: string): PalletResult => ({
    cartonsPerPallet: 0,
    geometricCapacity: 0,
    payloadCapacity: null,
    ti: 0,
    hi: 0,
    palletsRequired: 0,
    cartonsOnFinalPallet: 0,
    placements: [],
    layers: [],
    region: { x0, y0, x1: x0 + usableX, y1: y0 + usableY },
    loadedHeight: i.pallet.deck,
    remainingHeight: Math.max(0, i.pallet.maxHeight - i.pallet.deck),
    cargoWeightKg: 0,
    tareKg: i.pallet.tareKg,
    grossWeightKg: i.pallet.tareKg,
    remainingPayloadKg: i.pallet.maxPayloadKg,
    footprintUtilization: 0,
    volumeUtilization: 0,
    capacityLimit: 'footprint',
    limit: 'footprint',
    reducedSearch: false,
    issues: [msg],
  });

  if (usableX <= 0 || usableY <= 0) return empty('The edge clearance is larger than the pallet footprint. Reduce the clearance.');
  if (usableZ <= 0) return empty('The maximum loaded height leaves no room above the pallet deck. Increase the maximum loaded height.');
  const cartonVol = item[0] * item[1] * item[2];
  if ((usableX * usableY * usableZ) / cartonVol > MAX_ITEMS_GUARD)
    return empty('The carton is extremely small compared with the pallet. Check the carton dimensions and unit.');

  const payloadCap =
    i.pallet.maxPayloadKg === null ? null : Math.floor(i.pallet.maxPayloadKg / i.carton.weightKg + 1e-9);
  if (payloadCap !== null && payloadCap < 1)
    return empty('One carton exceeds the maximum payload of the pallet. Reduce the carton weight or raise the payload limit.');

  const common = {
    binX: usableX,
    binY: usableY,
    binZ: usableZ,
    item,
    upright: i.upright,
    rotateFloor: i.rotateFloor,
    maxLayers: i.stackable ? undefined : 1,
  };
  const full = stackLayers(common);
  if (full.capacity === 0) return empty('The carton does not fit on the pallet footprint or under the height limit. Check the dimensions or relax orientation limits.');

  const cap = payloadCap === null ? full.capacity : Math.min(full.capacity, payloadCap);
  const drawn = stackLayers({ ...common, maxItems: cap });

  const perPallet = drawn.count;
  const palletsRequired = Math.ceil(i.quantity / perPallet);
  const finalCount = i.quantity - (palletsRequired - 1) * perPallet;

  const loadedHeight = i.pallet.deck + drawn.usedHeight;
  const cargoKg = perPallet * i.carton.weightKg;

  // capacity limit for a FULL pallet
  let capacityLimit: PalletResult['capacityLimit'];
  if (payloadCap !== null && payloadCap < full.capacity) capacityLimit = 'payload';
  else if (!i.stackable) capacityLimit = 'footprint';
  else {
    const minLayerH = Math.min(item[0], item[1], item[2]);
    const heightBound = usableZ - drawn.usedHeight < (i.upright ? item[2] : minLayerH);
    capacityLimit = heightBound ? 'height' : 'footprint';
  }
  const limit: PalletLimit = i.quantity <= perPallet && i.quantity < full.capacity ? 'quantity' : capacityLimit;
  const palletArea = i.pallet.l * i.pallet.w;
  const bottomArea = drawn.placements.filter((p) => p.layer === 0).reduce((s, p) => s + p.l * p.w, 0);
  const palletRegionVolume = i.pallet.l * i.pallet.w * Math.max(1, loadedHeight - i.pallet.deck);

  return {
    cartonsPerPallet: perPallet,
    geometricCapacity: full.capacity,
    payloadCapacity: payloadCap,
    ti: drawn.bottomLayerCount,
    hi: drawn.layers.length,
    palletsRequired,
    cartonsOnFinalPallet: finalCount,
    placements: drawn.placements,
    layers: drawn.layers,
    region: { x0, y0, x1: x0 + usableX, y1: y0 + usableY },
    loadedHeight,
    remainingHeight: i.pallet.maxHeight - loadedHeight,
    cargoWeightKg: cargoKg,
    tareKg: i.pallet.tareKg,
    grossWeightKg: cargoKg + i.pallet.tareKg,
    remainingPayloadKg: i.pallet.maxPayloadKg === null ? null : i.pallet.maxPayloadKg - cargoKg,
    footprintUtilization: bottomArea / palletArea,
    volumeUtilization: drawn.usedVolume / palletRegionVolume,
    capacityLimit,
    limit,
    reducedSearch: full.reducedSearch,
    issues,
  };
}
