import { fmtLen } from './shared';
import type { LengthUnit } from '../../units';
import type { FloorPlacement } from '../../calculations/packing/floor';
import type { Placement3D } from '../../calculations/packing/layers';
import { classer, sideViewSvg, topViewSvg } from '../../render/svg';
import type { DiagramOut } from '../types';

/** Builds diagrams straight from engine placements (mm). No independent layout is created here. */
export function stackDiagrams(o: {
  placements: Placement3D[];
  binX: number;
  binY: number;
  binZ: number;
  base?: number;
  originX?: number;
  originY?: number;
  region?: { x0: number; y0: number; x1: number; y1: number };
  unit: LengthUnit;
  what: string;
  binName: string;
  endLabel?: string;
}): DiagramOut[] {
  const cls = classer();
  const ox = o.originX ?? 0;
  const oy = o.originY ?? 0;
  const bottom = o.placements.filter((p) => p.layer === 0);
  const layers = new Set(o.placements.map((p) => p.layer)).size;
  const top = topViewSvg({
    title: `Top view of ${o.what} in ${o.binName}`,
    desc: `${bottom.length} ${o.what} on the bottom layer, ${layers} layer${layers === 1 ? '' : 's'} in total. Drawn from the calculated coordinates.`,
    binX: o.binX,
    binY: o.binY,
    region: o.region,
    rects: bottom.map((p) => ({ x: p.x + ox, y: p.y + oy, l: p.l, w: p.w, cls: cls(p.orientation) })),
    xLabel: `${o.binName} length ${fmtLen(o.binX, o.unit)}`,
    yLabel: fmtLen(o.binY, o.unit),
    endLabel: o.endLabel,
  });
  const side = sideViewSvg({
    title: `Side view of ${o.what} in ${o.binName}`,
    desc: `Elevation showing ${layers} layer${layers === 1 ? '' : 's'}.`,
    binX: o.binX,
    binZ: o.binZ,
    base: o.base,
    rects: o.placements.map((p) => ({ x: p.x + ox, z: p.z, l: p.l, h: p.h, cls: cls(p.orientation) })),
    xLabel: fmtLen(o.binX, o.unit),
    zLabel: `Height ${fmtLen(o.binZ, o.unit)}`,
  });
  return [
    { title: 'Top view (bottom layer)', svg: top, caption: 'Colours show different carton orientations. Drawn from the calculated coordinates.' },
    { title: 'Side view', svg: side, caption: `${layers} layer${layers === 1 ? '' : 's'}. Identical items behind each other are drawn once.` },
  ];
}

export function floorDiagram(o: {
  placements: FloorPlacement[];
  binX: number;
  binY: number;
  unit: LengthUnit;
  what: string;
  binName: string;
  labels: string[];
  endLabel?: string;
  title?: string;
}): DiagramOut {
  const svg = topViewSvg({
    title: `Top view of ${o.what} in ${o.binName}`,
    desc: `${o.placements.length} ${o.what} placed on the floor. Drawn from the calculated coordinates.`,
    binX: o.binX,
    binY: o.binY,
    rects: o.placements.map((p) => ({ x: p.x, y: p.y, l: p.l, w: p.w, cls: p.footprint })),
    xLabel: `${o.binName} length ${fmtLen(o.binX, o.unit)}`,
    yLabel: fmtLen(o.binY, o.unit),
    endLabel: o.endLabel,
  });
  return { title: o.title ?? 'Floor layout (top view)', svg, caption: o.labels.join(' · ') };
}
