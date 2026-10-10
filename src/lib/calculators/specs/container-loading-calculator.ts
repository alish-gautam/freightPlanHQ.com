import { fixed, fmt, pct } from '../../formatting';
import { loadContainer, type ContainerSpec } from '../../calculations/container';
import { equipment, EQUIPMENT_NOTE, equipmentById } from '../../equipment';
import { sourceById } from '../../sources';
import { Checker } from '../../validation';
import { toKg } from '../../units';
import { fail, type CalculatorSpec, type CalcResult, type Stat } from '../types';
import { LENGTH_OPTIONS, WEIGHT_OPTIONS, bool, fmtKg, fmtLen, lengthUnit, num, str, toMm, weightUnit } from './shared';
import { stackDiagrams } from './diagram-helpers';

export const containerFills: Record<string, Record<string, number | string>> = {};
for (const e of equipment) {
  containerFills[e.id] = { contL: e.internalLength, contW: e.internalWidth, contH: e.internalHeight, doorW: e.doorWidth ?? '', doorH: e.doorHeight ?? '', payload: e.payloadKg ?? '', dimUnit: 'mm', weightUnit: 'kg' };
}

export const containerFields = (defaultId: string) => [
  {
    kind: 'select' as const,
    id: 'preset',
    label: 'Container',
    options: [...equipment.map((e) => ({ value: e.id, label: e.label })), { value: 'custom', label: 'Custom equipment' }],
    default: defaultId,
    fills: containerFills,
    help: EQUIPMENT_NOTE,
  },
];

export const containerDimFields = (e = equipmentById('20ft')!) => [
  { kind: 'number' as const, id: 'contL', label: 'Internal length', unitFrom: 'dimUnit', default: e.internalLength },
  { kind: 'number' as const, id: 'contW', label: 'Internal width', unitFrom: 'dimUnit', default: e.internalWidth },
  { kind: 'number' as const, id: 'contH', label: 'Internal height', unitFrom: 'dimUnit', default: e.internalHeight },
  { kind: 'number' as const, id: 'payload', label: 'Payload limit', unitFrom: 'weightUnit', default: e.payloadKg ?? '', optional: true, help: 'Approximate reference. Use the payload on your container’s plate. Leave empty for no limit.' },
  { kind: 'number' as const, id: 'doorW', label: 'Door opening width', unitFrom: 'dimUnit', default: e.doorWidth ?? '', optional: true },
  { kind: 'number' as const, id: 'doorH', label: 'Door opening height', unitFrom: 'dimUnit', default: e.doorHeight ?? '', optional: true },
];

export function readContainer(v: Record<string, unknown>, c: Checker, du: ReturnType<typeof lengthUnit>, wu: ReturnType<typeof weightUnit>): ContainerSpec | null {
  const ok = [c.positive(num(v.contL), 'Container internal length'), c.positive(num(v.contW), 'Container internal width'), c.positive(num(v.contH), 'Container internal height')].every(Boolean);
  const payload = num(v.payload);
  if (payload !== null) c.positive(payload, 'Payload limit');
  const dw = num(v.doorW);
  const dh = num(v.doorH);
  if (dw !== null) c.positive(dw, 'Door width');
  if (dh !== null) c.positive(dh, 'Door height');
  if (!ok) return null;
  const preset = equipmentById(str(v.preset));
  return {
    name: preset?.label ?? 'Custom container',
    length: toMm(num(v.contL)!, du),
    width: toMm(num(v.contW)!, du),
    height: toMm(num(v.contH)!, du),
    doorWidth: dw === null ? null : toMm(dw, du),
    doorHeight: dh === null ? null : toMm(dh, du),
    maxPayloadKg: payload === null ? null : toKg(payload, wu),
  };
}

export const equipmentNote = (id: string) => {
  const e = equipmentById(id);
  return e ? `${e.label}: reference specification. ${sourceById(e.source).organization}; reference check ${e.verified} (secondary cross-check). ${e.notes}` : 'Custom equipment: values are the ones you entered.';
};

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Container',
      fields: [
        { kind: 'select', id: 'dimUnit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'mm' },
        { kind: 'select', id: 'weightUnit', label: 'Weight unit', options: WEIGHT_OPTIONS.slice(0, 2), default: 'kg' },
        ...containerFields('20ft'),
        ...containerDimFields().slice(0, 4),
      ],
    },
    {
      title: 'Cargo',
      fields: [
        { kind: 'select', id: 'pkg', label: 'Package type', options: [{ value: 'carton', label: 'Carton / case' }, { value: 'crate', label: 'Crate / box' }, { value: 'pallet', label: 'Loaded pallet' }, { value: 'drum', label: 'Drum / barrel' }], default: 'carton' },
        { kind: 'number', id: 'cl', label: 'Length', unitFrom: 'dimUnit', default: 600 },
        { kind: 'number', id: 'cw', label: 'Width', unitFrom: 'dimUnit', default: 400 },
        { kind: 'number', id: 'ch', label: 'Height', unitFrom: 'dimUnit', default: 400 },
        { kind: 'number', id: 'cwt', label: 'Weight per piece', unitFrom: 'weightUnit', default: 15 },
        { kind: 'number', id: 'qty', label: 'Quantity', integer: true, default: 1500, min: 1 },
      ],
    },
    {
      advanced: true,
      title: 'Orientation, clearance and door',
      fields: [
        { kind: 'check', id: 'upright', label: 'Keep pieces upright (height stays vertical)', default: false },
        { kind: 'check', id: 'rotate', label: 'Allow 90° rotation on the floor', default: true },
        { kind: 'number', id: 'wall', label: 'Clearance from walls and roof', unitFrom: 'dimUnit', default: 0, optional: true },
        { kind: 'number', id: 'gap', label: 'Handling gap between pieces', unitFrom: 'dimUnit', default: 0, optional: true },
        { kind: 'check', id: 'useDoor', label: 'Pieces must pass through the door opening', default: false },
        ...containerDimFields().slice(4),
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const du = lengthUnit(v.dimUnit, 'mm');
    const wu = weightUnit(v.weightUnit);
    const cont = readContainer(v, c, du, wu);
    const ok = [c.positive(num(v.cl), 'Piece length'), c.positive(num(v.cw), 'Piece width'), c.positive(num(v.ch), 'Piece height'), c.positive(num(v.cwt), 'Piece weight'), c.integerPositive(num(v.qty), 'Quantity')].every(Boolean);
    const wall = num(v.wall) ?? 0;
    const gap = num(v.gap) ?? 0;
    c.nonNegative(wall, 'Wall clearance');
    c.nonNegative(gap, 'Handling gap');
    if (bool(v.useDoor) && (!cont || cont.doorWidth === null || cont.doorHeight === null)) c.fail('Enter the door opening width and height, or turn off the door constraint.');
    if (!cont || !ok || !c.ok) return fail(c.issues);
    const piece = { l: toMm(num(v.cl)!, du), w: toMm(num(v.cw)!, du), h: toMm(num(v.ch)!, du), weightKg: toKg(num(v.cwt)!, wu) };
    const upright = bool(v.upright);
    const r = loadContainer({
      container: cont,
      cargo: { ...piece, quantity: num(v.qty)!, packageType: str(v.pkg) },
      upright,
      rotateFloor: bool(v.rotate),
      wallClearance: toMm(wall, du),
      handlingGap: toMm(gap, du),
      useDoorConstraint: bool(v.useDoor),
    });
    if (r.issues.length) return fail(r.issues);
    const total = num(v.qty)!;
    const limitText: Record<string, string> = {
      quantity: 'Quantity is the limiting constraint: the whole order fits.',
      payload: 'Weight is the limiting constraint: the payload limit is reached before the space is full.',
      'door opening': 'The door opening is limiting: some orientations that would pack more cannot pass through the door.',
      orientation: 'Orientation rules are limiting: allowing more orientations would load more pieces.',
      'floor geometry': 'Floor geometry is limiting: the piece sizes leave unused floor area that no additional piece can use.',
      height: 'Height is limiting: unused height remains, but not enough for another layer.',
      volume: 'Volume is limiting: the usable space is almost fully used by this arrangement.',
    };
    const interp = [
      `This arrangement loads ${fmt(r.loaded, 'count')} piece${r.loaded === 1 ? '' : 's'} into one ${cont.name} from a total order of ${fmt(total, 'count')} piece${total === 1 ? '' : 's'} (${fmt(r.remaining, 'count')} remaining after the first container).`,
      r.containersRequired !== null
        ? `Based on packing ${fmt(r.loaded, 'count')} pieces per container, approximately ${fmt(r.containersRequired, 'count')} ${r.containersRequired === 1 ? 'container' : 'containers'} will be required to ship the full order (planning estimate based on selected equipment and packing assumptions; real-world loading may vary with dunnage, axle weight limits, and weight distribution).`
        : '',
      `Recommended capacity is ${fmt(r.recommendedCapacity, 'count')} pieces per container under payload and dimensional constraints (geometric capacity is ${fmt(r.geometricCapacity, 'count')} pieces).`,
      limitText[r.limit],
    ].filter(Boolean);
    if (r.payloadCapacity !== null && r.limit !== 'payload') interp.push(`The payload limit would allow ${fmt(r.payloadCapacity, 'count')} pieces, so weight is not the constraint here.`);
    const warnings: string[] = [];
    if ((str(v.pkg) === 'pallet' || str(v.pkg) === 'drum') && !upright) warnings.push('Pallets and drums are normally kept upright. Turn on “Keep pieces upright” unless you are sure they can be laid down.');
    if (r.reducedSearch) warnings.push('This piece size was large and awkward, so a simplified floor search was used. Another arrangement may fit slightly more.');
    const diagrams = stackDiagrams({ placements: r.placements, binX: cont.length, binY: cont.width, binZ: cont.height, unit: du, what: 'pieces', binName: 'container', endLabel: 'Back wall (x = 0) → doors at far end' });

    const stats: Stat[] = [
      ...(r.containersRequired !== null
        ? [
            {
              label: 'Containers required',
              value: `${fmt(r.containersRequired, 'count')} ${r.containersRequired === 1 ? 'container' : 'containers'}`,
              hint: `Planning estimate: ⌈${fmt(total, 'count')} order pieces ÷ ${fmt(r.loaded, 'count')} loaded/container⌉`,
            },
          ]
        : []),
      {
        label: 'Pieces loaded (1 container)',
        value: `${fmt(r.loaded, 'count')} of ${fmt(total, 'count')}`,
        hint: `${fmt(r.loaded, 'count')} pieces packed in this container`,
      },
      {
        label: 'Total order quantity',
        value: fmt(total, 'count'),
        hint: 'Total pieces in your shipment order',
      },
      {
        label: 'Remaining quantity',
        value: fmt(r.remaining, 'count'),
        hint: r.remaining > 0 ? 'Unloaded after 1st container' : 'Entire order loaded in 1 container',
      },
      {
        label: 'Recommended capacity',
        value: fmt(r.recommendedCapacity, 'count'),
        hint:
          r.payloadCapacity !== null && r.payloadCapacity < r.geometricCapacity
            ? `Capacity under payload/dimensional constraints (payload limit ${fmt(r.payloadCapacity, 'count')} pieces)`
            : `Capacity under payload/dimensional constraints (geometric fit ${fmt(r.geometricCapacity, 'count')} pieces)`,
      },
      {
        label: 'Geometric capacity',
        value: fmt(r.geometricCapacity, 'count'),
        hint: 'Theoretical 3D packing capacity before payload or order quantity constraints',
      },
      { label: 'Cube utilization', value: pct(r.cubeUtilization), hint: 'Cargo volume ÷ internal container volume' },
      { label: 'Weight loaded', value: fmtKg(r.weightKg, wu), hint: r.weightUtilization === null ? 'No payload limit set' : `${pct(r.weightUtilization)} of payload limit` },
      { label: 'Unused volume', value: `${fixed(r.unusedVolumeM3, 2)} m³` },
      { label: 'Layers', value: fmt(r.layers.length, 'count') },
      { label: 'Loaded length used', value: fmtLen(r.usedLength, du) },
    ];

    return {
      ok: true,
      headline: {
        label: 'Containers required & pieces loaded',
        value:
          r.containersRequired !== null
            ? `${fmt(r.containersRequired, 'count')} ${r.containersRequired === 1 ? 'container' : 'containers'} (${fmt(r.loaded, 'count')} in first)`
            : `${fmt(r.loaded, 'count')} of ${fmt(total, 'count')}`,
        sub: `${cont.name} · ${fmt(r.loaded, 'count')} pieces loaded per container · ${fmt(total, 'count')} total order`,
      },
      stats,
      interpretation: interp,
      warnings,
      diagrams,
      assumptions: [
        equipmentNote(str(v.preset)),
        'Containers required = ⌈Total Order Quantity ÷ Pieces Loaded per Container⌉. This is a planning result based on the selected equipment and deterministic packing assumptions; actual real-world loading across multiple containers may vary due to weight distribution, dunnage, bracing, and cargo securing.',
        'Recommended capacity defines the maximum feasible pieces per container constrained by both 3D interior geometry and equipment payload limits.',
        'Layer-based 3D packing of identical rectangular pieces: each layer is a 2D floor packing; layers of different orientations can be combined. No randomness, same input gives the same result.',
        'This is the best tested arrangement, not a proof of the global optimum. Real loading needs bracing, dunnage and weight distribution.',
        EQUIPMENT_NOTE,
      ],
      links: [
        { href: '/guides/shipping-container-dimensions/', label: 'Container dimensions and what varies' },
        { href: '/pallets-per-container-calculator/', label: 'Loading pallets instead of loose cartons?' },
      ],
    };
  },
};
export default spec;
