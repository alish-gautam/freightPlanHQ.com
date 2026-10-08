import { fixed } from '../../formatting';
import { calculateGirth } from '../../calculations/girth';
import { Checker } from '../../validation';
import { fail, type CalculatorSpec, type CalcResult } from '../types';
import { LENGTH_OPTIONS, lengthUnit, num } from './shared';

import type { ThresholdSpec } from '../../calculations/girth';

const THRESHOLD_OPTIONS = [
  { value: 'none', label: 'No threshold comparison (calculate length & girth only)' },
  {
    value: 'usps_standard_108',
    label: '108 in — USPS Standard Limit (Length + Girth; DMM reference)',
  },
  {
    value: 'usps_max_130',
    label: '130 in — USPS Ground Advantage Maximum (Length + Girth; nonmailable over 130 in)',
  },
  {
    value: 'ups_fedex_large_130',
    label: '130 in — UPS & FedEx Large Package / Oversize Threshold (Length + Girth)',
  },
  {
    value: 'ups_fedex_max_165',
    label: '165 in — UPS & FedEx Maximum Package Size Limit (Length + Girth; carrier network limit)',
  },
  {
    value: 'ups_fedex_len_108',
    label: '108 in — UPS & FedEx Maximum Single-Side Length Limit (Length only)',
  },
  {
    value: 'courier_300_cm',
    label: '300 cm — International Courier Single-Side Length Reference (Length only)',
  },
  { value: 'custom_lg', label: 'Custom Length + Girth threshold' },
  { value: 'custom_len', label: 'Custom Single-Side Length threshold' },
];

const spec: CalculatorSpec = {
  sections: [
    {
      title: 'Package dimensions',
      description: 'Enter the outer package dimensions. Length is automatically identified as the longest dimension.',
      fields: [
        { kind: 'select', id: 'unit', label: 'Dimension unit', options: LENGTH_OPTIONS, default: 'in' },
        { kind: 'number', id: 'dim1', label: 'First dimension', unitFrom: 'unit', default: 36 },
        { kind: 'number', id: 'dim2', label: 'Second dimension', unitFrom: 'unit', default: 24 },
        { kind: 'number', id: 'dim3', label: 'Third dimension', unitFrom: 'unit', default: 20 },
      ],
    },
    {
      title: 'Carrier limit comparison',
      description: 'Compare against carrier size thresholds for maximum allowable size or oversize surcharges.',
      fields: [
        {
          kind: 'select',
          id: 'thresholdPreset',
          label: 'Service threshold preset',
          options: THRESHOLD_OPTIONS,
          default: 'ups_fedex_large_130',
          help: 'Example service limit — verify current carrier rules.',
        },
        {
          kind: 'number',
          id: 'customThreshold',
          label: 'Custom threshold value',
          unitFrom: 'unit',
          default: 130,
          showIf: { field: 'thresholdPreset', equals: ['custom_lg', 'custom_len'] },
          help: 'Enter the maximum dimension or length + girth specified in your carrier tariff.',
        },
      ],
    },
  ],
  compute(v): CalcResult {
    const c = new Checker();
    const u = lengthUnit(v.unit, 'in');

    const d1 = num(v.dim1);
    const d2 = num(v.dim2);
    const d3 = num(v.dim3);

    const ok = [c.positive(d1, 'First dimension'), c.positive(d2, 'Second dimension'), c.positive(d3, 'Third dimension')].every(Boolean);
    if (!ok || !c.ok) return fail(c.issues);

    let threshold: ThresholdSpec | null = null;
    let thresholdDesc = '';
    const preset = String(v.thresholdPreset ?? 'ups_fedex_large_130');

    if (preset === 'usps_standard_108') {
      threshold = { value: 108, unit: 'in', target: 'lengthPlusGirth' };
      thresholdDesc = 'USPS standard maximum combined size (108 in L+G; packages between 108 in and 130 in incur oversized pricing)';
    } else if (preset === 'usps_max_130') {
      threshold = { value: 130, unit: 'in', target: 'lengthPlusGirth' };
      thresholdDesc = 'USPS absolute maximum size (130 in L+G; parcels exceeding 130 in are nonmailable)';
    } else if (preset === 'ups_fedex_large_130' || preset === '130_in') {
      threshold = { value: 130, unit: 'in', target: 'lengthPlusGirth' };
      thresholdDesc = 'UPS & FedEx Large Package / Oversize Surcharge threshold (130 in L+G)';
    } else if (preset === 'ups_fedex_max_165' || preset === '165_in') {
      threshold = { value: 165, unit: 'in', target: 'lengthPlusGirth' };
      thresholdDesc = 'UPS & FedEx Maximum Package Size limit (165 in L+G; packages over 165 in are unauthorized/over-maximum)';
    } else if (preset === 'ups_fedex_len_108' || preset === '108_in') {
      threshold = { value: 108, unit: 'in', target: 'length' };
      thresholdDesc = 'UPS & FedEx Maximum Single-Side Length limit (108 in max length)';
    } else if (preset === 'courier_300_cm' || preset === '300_cm') {
      threshold = { value: 300, unit: 'cm', target: 'length' };
      thresholdDesc = 'International courier maximum single-side length reference (300 cm length limit)';
    } else if (preset === 'custom_lg' || preset === 'custom') {
      const cust = num(v.customThreshold);
      if (cust !== null && cust > 0) {
        threshold = { value: cust, unit: u, target: 'lengthPlusGirth' };
        thresholdDesc = `Custom length plus girth limit (${fixed(cust, 1)} ${u})`;
      }
    } else if (preset === 'custom_len') {
      const cust = num(v.customThreshold);
      if (cust !== null && cust > 0) {
        threshold = { value: cust, unit: u, target: 'length' };
        thresholdDesc = `Custom single-side length limit (${fixed(cust, 1)} ${u})`;
      }
    }

    const r = calculateGirth([d1!, d2!, d3!], u, threshold);

    const interp: string[] = [
      `Longest side (length): ${fixed(r.length, 2)} ${u}.`,
      `Girth around cross-section: 2 × (${fixed(r.width, 2)} + ${fixed(r.height, 2)}) = ${fixed(r.girth, 2)} ${u}.`,
      `Combined length plus girth: ${fixed(r.length, 2)} + ${fixed(r.girth, 2)} = ${fixed(r.lengthPlusGirth, 2)} ${u}.`,
    ];

    const warnings: string[] = [];

    if (r.threshold !== null && r.withinThreshold !== null) {
      const targetLabel = r.thresholdTarget === 'length' ? 'longest side (length)' : 'length + girth';
      if (r.withinThreshold) {
        interp.push(
          `Within the selected limit: ${targetLabel} is ${fixed(r.thresholdTarget === 'length' ? r.length : r.lengthPlusGirth, 2)} ${u} vs ${fixed(r.threshold, 1)} ${u} (${thresholdDesc}). Margin: ${fixed(r.margin!, 1)} ${u} under limit. Example service limit — verify current carrier rules.`,
        );
      } else {
        const over = Math.abs(r.margin!);
        interp.push(
          `EXCEEDS the selected limit: ${targetLabel} is ${fixed(r.thresholdTarget === 'length' ? r.length : r.lengthPlusGirth, 2)} ${u} vs ${fixed(r.threshold, 1)} ${u} (${thresholdDesc}) by ${fixed(over, 1)} ${u}. Carrier oversize, large package, or maximum network surcharges apply. Example service limit — verify current carrier rules.`,
        );
        warnings.push(`Package exceeds the selected ${fixed(r.threshold, 1)} ${u} threshold (${thresholdDesc}). Example service limit — verify current carrier rules.`);
      }
    }

    interp.push(
      'Carrier thresholds and measurement rules vary. Always confirm whether your service measures outermost protrusions and whether dimensions are rounded up to the nearest whole unit.',
    );

    const stats = [
      { label: 'Length (longest side)', value: `${fixed(r.length, 2)} ${u}` },
      { label: 'Girth 2 × (W + H)', value: `${fixed(r.girth, 2)} ${u}` },
      { label: 'Length + Girth', value: `${fixed(r.lengthPlusGirth, 2)} ${u}` },
      ...(r.threshold !== null
        ? [
            {
              label: r.thresholdTarget === 'length' ? 'Length threshold' : 'Length + Girth threshold',
              value: `${fixed(r.threshold, 1)} ${u}`,
              hint: r.withinThreshold ? `${fixed(r.margin!, 1)} ${u} under limit` : `${fixed(Math.abs(r.margin!), 1)} ${u} over limit`,
            },
          ]
        : []),
    ];

    return {
      ok: true,
      headline: {
        label: 'Length + Girth',
        value: `${fixed(r.lengthPlusGirth, 2)} ${u}`,
        sub: `Length: ${fixed(r.length, 2)} ${u} · Girth: ${fixed(r.girth, 2)} ${u}`,
      },
      stats,
      interpretation: interp,
      warnings: warnings.length ? warnings : undefined,
      tables: [
        {
          caption: 'Measurement breakdown',
          head: ['Measurement', 'Value', 'Formula / Basis'],
          rows: [
            ['Length', `${fixed(r.length, 2)} ${u}`, 'Longest package dimension'],
            ['Width', `${fixed(r.width, 2)} ${u}`, 'Second longest dimension'],
            ['Height', `${fixed(r.height, 2)} ${u}`, 'Shortest dimension'],
            ['Girth', `${fixed(r.girth, 2)} ${u}`, '2 × (Width + Height)'],
            ['Length + Girth', `${fixed(r.lengthPlusGirth, 2)} ${u}`, 'Length + 2 × (Width + Height)'],
          ],
        },
      ],
      assumptions: [
        'Length is designated as the largest single dimension regardless of package orientation.',
        'Girth is measured as the distance around the perimeter perpendicular to length: 2 × (width + height).',
        'Carrier rounding rules (such as rounding fractions up to whole inches) are not applied automatically unless entered directly.',
      ],
      links: [
        { href: '/dimensional-weight-calculator/', label: 'Calculate dimensional weight for this package' },
        { href: '/box-volume-calculator/', label: 'Calculate cubic volume' },
      ],
    };
  },
};

export default spec;
