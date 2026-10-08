import { escapeHtml as e } from '../formatting';

/**
 * SVG renderers. They draw EXACTLY the coordinates returned by the packing engines.
 * No layout is invented here. Coordinates are millimetres.
 */
export interface TopRect {
  x: number;
  y: number;
  l: number;
  w: number;
  /** colour class index (orientation) */
  cls?: number;
}
export interface SideRect {
  x: number;
  z: number;
  l: number;
  h: number;
  cls?: number;
}

let uid = 0;
const num = (n: number) => Math.round(n * 100) / 100;

function wrap(vbW: number, vbH: number, title: string, desc: string, body: string): string {
  const id = `svg${++uid}`;
  return `<svg class="layout-svg" viewBox="0 0 ${num(vbW)} ${num(vbH)}" role="img" aria-labelledby="${id}t ${id}d" preserveAspectRatio="xMidYMid meet"><title id="${id}t">${e(title)}</title><desc id="${id}d">${e(desc)}</desc>${body}</svg>`;
}

export interface TopViewOpts {
  title: string;
  desc: string;
  /** outline of the bin (pallet / container floor / trailer) from (0,0) */
  binX: number;
  binY: number;
  /** usable region if it differs from the outline (clearance / overhang) */
  region?: { x0: number; y0: number; x1: number; y1: number };
  rects: TopRect[];
  /** text labels for dimensions, already formatted with units */
  xLabel: string;
  yLabel: string;
  /** optional marker text drawn at the x = 0 end, e.g. "Doors" or "Front" */
  endLabel?: string;
}

export function topViewSvg(o: TopViewOpts): string {
  const W = 640;
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 32;
  let minX = Math.min(0, o.region?.x0 ?? 0, ...o.rects.map((r) => r.x));
  let minY = Math.min(0, o.region?.y0 ?? 0, ...o.rects.map((r) => r.y));
  let maxX = Math.max(o.binX, o.region?.x1 ?? 0, ...o.rects.map((r) => r.x + r.l));
  let maxY = Math.max(o.binY, o.region?.y1 ?? 0, ...o.rects.map((r) => r.y + r.w));
  const dx = Math.max(1, maxX - minX);
  const s = (W - padL - padR) / dx;
  const H = Math.max(80, (maxY - minY) * s) + padT + padB;
  const tx = (x: number) => padL + (x - minX) * s;
  const ty = (y: number) => padT + (y - minY) * s;
  const detail = o.rects.length <= 1200;
  let body = `<rect class="svg-bin" x="${num(tx(0))}" y="${num(ty(0))}" width="${num(o.binX * s)}" height="${num(o.binY * s)}"/>`;
  if (o.region)
    body += `<rect class="svg-region" x="${num(tx(o.region.x0))}" y="${num(ty(o.region.y0))}" width="${num((o.region.x1 - o.region.x0) * s)}" height="${num((o.region.y1 - o.region.y0) * s)}"/>`;
  for (const r of o.rects)
    body += `<rect class="svg-box svg-box-${r.cls ?? 0}${detail ? '' : ' svg-box-flat'}" x="${num(tx(r.x))}" y="${num(ty(r.y))}" width="${num(r.l * s)}" height="${num(r.w * s)}"/>`;
  if (o.endLabel) body += `<text class="svg-note" x="${num(tx(0) + 4)}" y="${num(ty(0) - 3)}">${e(o.endLabel)}</text>`;
  body += `<text class="svg-label" x="${num(tx(0) + (o.binX * s) / 2)}" y="${num(H - 8)}" text-anchor="middle">${e(o.xLabel)}</text>`;
  body += `<text class="svg-label" transform="translate(12 ${num(ty(0) + (o.binY * s) / 2)}) rotate(-90)" text-anchor="middle">${e(o.yLabel)}</text>`;
  return wrap(W, H, o.title, o.desc, body);
}

export interface SideViewOpts {
  title: string;
  desc: string;
  binX: number;
  /** height of the bin / container interior (or max loaded height) */
  binZ: number;
  /** solid base under the cargo (pallet deck), drawn from z = 0 */
  base?: number;
  /** cargo z values are measured from the top of `base` */
  rects: SideRect[];
  /** horizontal limit line, e.g. maximum loaded height */
  limitZ?: number;
  limitLabel?: string;
  xLabel: string;
  zLabel: string;
}

export function sideViewSvg(o: SideViewOpts): string {
  const W = 640;
  const padL = 44;
  const padR = 14;
  const padT = 14;
  const padB = 32;
  const maxX = Math.max(o.binX, ...o.rects.map((r) => r.x + r.l));
  const base = o.base ?? 0;
  const maxZ = Math.max(1, o.binZ, base + Math.max(0, ...o.rects.map((r) => r.z + r.h)));
  const dx = Math.max(1, maxX);
  const s = (W - padL - padR) / dx;
  const H = Math.max(80, maxZ * s) + padT + padB;
  const tx = (x: number) => padL + x * s;
  const ty = (z: number) => padT + (maxZ - z) * s;
  let body = `<rect class="svg-bin" x="${num(tx(0))}" y="${num(ty(o.binZ))}" width="${num(o.binX * s)}" height="${num(o.binZ * s)}"/>`;
  if (base > 0) body += `<rect class="svg-base" x="${num(tx(0))}" y="${num(ty(base))}" width="${num(o.binX * s)}" height="${num(base * s)}"/>`;
  // identical outlines behind each other (same x, z, l, h) are drawn once
  const seen = new Set<string>();
  for (const r of o.rects) {
    const k = `${r.x}|${r.z}|${r.l}|${r.h}|${r.cls ?? 0}`;
    if (seen.has(k)) continue;
    seen.add(k);
    body += `<rect class="svg-box svg-box-${r.cls ?? 0}" x="${num(tx(r.x))}" y="${num(ty(base + r.z + r.h))}" width="${num(r.l * s)}" height="${num(r.h * s)}"/>`;
  }
  if (o.limitZ !== undefined)
    body += `<line class="svg-limit" x1="${num(tx(0))}" x2="${num(tx(o.binX))}" y1="${num(ty(o.limitZ))}" y2="${num(ty(o.limitZ))}"/><text class="svg-note" x="${num(tx(o.binX) - 4)}" y="${num(ty(o.limitZ) - 4)}" text-anchor="end">${e(o.limitLabel ?? '')}</text>`;
  body += `<text class="svg-label" x="${num(tx(0) + (o.binX * s) / 2)}" y="${num(H - 8)}" text-anchor="middle">${e(o.xLabel)}</text>`;
  body += `<text class="svg-label" transform="translate(12 ${num(padT + (maxZ * s) / 2)}) rotate(-90)" text-anchor="middle">${e(o.zLabel)}</text>`;
  return wrap(W, H, o.title, o.desc, body);
}

/** Cls index for an orientation label, stable within one result. */
export function classer(): (label: string) => number {
  const m = new Map<string, number>();
  return (label) => {
    if (!m.has(label)) m.set(label, Math.min(m.size, 3));
    return m.get(label)!;
  };
}
