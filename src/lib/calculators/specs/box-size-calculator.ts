import { fixed, pct } from '../../formatting';
import { recommendBox, type BoxSizeResult } from '../../calculations/box-size';
import { Checker } from '../../validation';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, lengthUnit, num } from './shared';
import { toMetres } from '../../units';

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Product dimensions',
      description: 'Enter the dimensions of a single item/product to pack into a shipping box.',
      fields: [
        { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'cm' },
        { kind: 'number', id: 'pl', label: 'Product length', unitFrom: 'unit', default: 20 },
        { kind: 'number', id: 'pw', label: 'Product width', unitFrom: 'unit', default: 15 },
        { kind: 'number', id: 'ph', label: 'Product height', unitFrom: 'unit', default: 10 },
        { kind: 'number', id: 'qty', label: 'Units per box', integer: true, default: 6, min: 1 },
      ],
    },
    {
      title: 'Padding and box thickness',
      description: 'Add allowances for protective bubble wrap, dunnage, foam, or corrugated board walls.',
      fields: [
        {
          kind: 'number',
          id: 'padding',
          label: 'Protective padding per side',
          unitFrom: 'unit',
          default: 1.5,
          help: 'Clearance between product and outer wall on each side (e.g. 1.5 cm or 0.5 in).',
        },
        {
          kind: 'number',
          id: 'board',
          label: 'Carton board thickness (single wall)',
          unitFrom: 'unit',
          default: 0.4,
          help: 'Single wall corrugated board is typically ~0.3–0.4 cm (1/8 in); double wall ~0.7 cm.',
        },
      ],
    },
    {
      advanced: true,
      title: 'Advanced packing options',
      fields: [
        {
          kind: 'check',
          id: 'allowRotation',
          label: 'Allow 3D product rotation (test all 6 orientations)',
          default: true,
        },
        {
          kind: 'number',
          id: 'divider',
          label: 'Divider / gap between adjacent units',
          unitFrom: 'unit',
          default: 0,
          help: 'Optional clearance or partition thickness between products.',
        },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const u = lengthUnit(v.unit, 'cm');

    const pl = num(v.pl);
    const pw = num(v.pw);
    const ph = num(v.ph);
    const qty = num(v.qty);
    const padding = num(v.padding) ?? 0;
    const board = num(v.board) ?? 0;
    const divider = num(v.divider) ?? 0;
    const allowRotation = Boolean(v.allowRotation);

    const ok = [
      c.positive(pl, 'Product length'),
      c.positive(pw, 'Product width'),
      c.positive(ph, 'Product height'),
      c.integerPositive(qty, 'Units per box'),
      c.nonNegative(padding, 'Protective padding'),
      c.nonNegative(board, 'Board thickness'),
      c.nonNegative(divider, 'Divider clearance'),
    ].every(Boolean);

    if (!ok || !c.ok) return fail(c.issues);

    if (qty! > 1000) return fail(['Units per box must be 1,000 or fewer for grid evaluation.']);

    let r: BoxSizeResult;
    try {
      r = recommendBox({
        length: pl!,
        width: pw!,
        height: ph!,
        unit: u,
        quantity: qty!,
        padding,
        dividerClearance: divider,
        boardThickness: board,
        allowRotation,
      });
    } catch (err: unknown) {
      return fail([err instanceof Error ? err.message : 'Box sizing calculation failed.']);
    }

    const [inL, inW, inH] = r.internal;
    const [outL, outW, outH] = r.outside;

    // Approximate DIM weight under active units and standard divisors
    let dimEstText = '';
    const outMetresL = toMetres(outL, u);
    const outMetresW = toMetres(outW, u);
    const outMetresH = toMetres(outH, u);
    const cbm = outMetresL * outMetresW * outMetresH;
    const kgDim5000 = (cbm * 1_000_000) / 5000;
    if (u === 'in') {
      const in3 = outL * outW * outH;
      const lbDim139 = in3 / 139;
      dimEstText = `Approx. ${fixed(lbDim139, 2)} lb (139 in³/lb parcel divisor) · ${fixed(kgDim5000, 2)} kg`;
    } else {
      const in3 = (outMetresL / 0.0254) * (outMetresW / 0.0254) * (outMetresH / 0.0254);
      const lbDim139 = in3 / 139;
      dimEstText = `Approx. ${fixed(kgDim5000, 2)} kg (5,000 cm³/kg courier divisor) · ${fixed(lbDim139, 2)} lb`;
    }

    const interp: string[] = [
      `Calculated minimum interior box dimensions: ${fixed(inL, 1)} × ${fixed(inW, 1)} × ${fixed(inH, 1)} ${u}.`,
      `Estimated exterior box dimensions: ${fixed(outL, 1)} × ${fixed(outW, 1)} × ${fixed(outH, 1)} ${u} (including ${fixed(board, 2)} ${u} wall thickness).`,
      `Optimal grid arrangement: ${r.grid.nx} × ${r.grid.ny} × ${r.grid.nz} units (${r.unitsPacked} packed${r.emptySlots > 0 ? `, ${r.emptySlots} empty slot${r.emptySlots === 1 ? '' : 's'}` : ''}).`,
      `Cube utilization inside the box is ${pct(r.cubeUtilization)} (product volume ${fixed(r.productVolume, 0)} ${u}³ vs internal volume ${fixed(r.internalVolume, 0)} ${u}³).`,
      'This calculation models theoretical custom carton dimensions. It does not select from manufactured off-the-shelf stock carton inventories (e.g. standard FEFCO codes or catalog boxes). For off-the-shelf procurement, select the nearest manufactured box with interior dimensions equal to or exceeding these values.',
    ];

    const stats = [
      {
        label: 'Interior dimensions (L × W × H)',
        value: `${fixed(inL, 1)} × ${fixed(inW, 1)} × ${fixed(inH, 1)} ${u}`,
      },
      {
        label: 'Exterior dimensions (L × W × H)',
        value: `${fixed(outL, 1)} × ${fixed(outW, 1)} × ${fixed(outH, 1)} ${u}`,
      },
      {
        label: 'Packing grid (X × Y × Z)',
        value: `${r.grid.nx} × ${r.grid.ny} × ${r.grid.nz}`,
        hint: `${r.unitsPacked} units packed`,
      },
      {
        label: 'Interior space utilization',
        value: pct(r.cubeUtilization),
        hint: r.emptySlots > 0 ? `${r.emptySlots} unfilled slot(s)` : 'Full tight grid',
      },
      {
        label: 'Estimated dimensional weight',
        value: dimEstText,
      },
    ];

    return {
      ok: true,
      headline: {
        label: 'Calculated minimum internal box dimensions',
        value: `${fixed(inL, 1)} × ${fixed(inW, 1)} × ${fixed(inH, 1)} ${u}`,
        sub: `Exterior: ${fixed(outL, 1)} × ${fixed(outW, 1)} × ${fixed(outH, 1)} ${u} · ${r.grid.nx}×${r.grid.ny}×${r.grid.nz} grid (custom carton model)`,
      },
      stats,
      interpretation: interp,
      tables: [
        {
          caption: 'Box specification summary',
          head: ['Parameter', 'Internal', 'External (Outside)'],
          rows: [
            ['Length', `${fixed(inL, 1)} ${u}`, `${fixed(outL, 1)} ${u}`],
            ['Width', `${fixed(inW, 1)} ${u}`, `${fixed(outW, 1)} ${u}`],
            ['Height', `${fixed(inH, 1)} ${u}`, `${fixed(outH, 1)} ${u}`],
            ['Volume', `${fixed(r.internalVolume, 0)} ${u}³`, `${fixed(r.outsideVolume, 0)} ${u}³`],
          ],
        },
      ],
      assumptions: [
        'Internal dimensions = (grid count × oriented unit size) + divider allowances + (2 × padding).',
        'Exterior dimensions = internal dimensions + (2 × board thickness).',
        'Grid searches all candidate rectangular factors to minimize total internal volume.',
      ],
      links: [
        { href: '/box-volume-calculator/', label: 'Convert box volume to litres, m³, or ft³' },
        { href: '/dimensional-weight-calculator/', label: 'Compare actual vs dimensional weight' },
        { href: '/pallet-calculator/', label: 'Plan pallet loading for these boxes' },
      ],
    };
  },
};

export default spec;
