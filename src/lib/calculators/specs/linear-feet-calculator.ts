import { fixed, fmt, pct } from '../../formatting';
import { Checker } from '../../validation';
import type { CalculatorSpec, CalcResult } from '../types';
import {
  failFrom,
  parseTrailer,
  trailerCommonStats,
  trailerDiagram,
  trailerSections,
} from './trailer-shared';

const MM_TO_FT = 1 / 304.8;

const spec: CalculatorSpec = {
  sections: trailerSections({
    unit: 'in',
    trailerW: 96,
    trailerL: 636, // 53 ft trailer = 636 in
    item: { l: 48, w: 40, h: 48 },
    qty: 12,
    presetDefault: 'gma',
    widthLabel: 'Usable trailer width (planning preset: 96 in; 102 in vans typically provide 96–100 in inside width)',
    lengthLabel: 'Trailer internal length (reference semi-trailer assumption: 636 in / 53 ft; 28 ft pups and 48 ft vans also common)',
    presetFillUnit: 'in',
  }),
  compute(v): CalcResult {
    const c = new Checker();
    const p = parseTrailer(v, c);
    if ('error' in p) return failFrom(p);

    const linearFtUsed = p.r.lengthUsed * MM_TO_FT;
    const trailerLenFt = p.length !== null ? p.length * MM_TO_FT : null;

    const interp: string[] = [
      `This shipment occupies ${fixed(linearFtUsed, 1)} linear feet (${fixed(p.r.lengthUsed / 25.4, 0)} inches) of trailer floor space across ${fmt(p.r.rows, 'count')} row${p.r.rows === 1 ? '' : 's'}.`,
      `${fmt(p.qty, 'count')} pieces require ${fmt(p.r.floorPositions, 'count')} floor position${p.r.floorPositions === 1 ? '' : 's'} at up to ${fmt(p.r.unitsPerRow, 'count')} unit${p.r.unitsPerRow === 1 ? '' : 's'} side-by-side.`,
    ];

    if (p.r.effectiveStack > 1) {
      interp.push(
        `Freight is stacked ${p.r.effectiveStack} high, reducing floor positions from ${p.qty} to ${p.r.floorPositions}.`,
      );
    }
    if (p.r.stackNote) interp.push(p.r.stackNote);

    if (trailerLenFt !== null) {
      if (p.r.fits) {
        interp.push(
          `Utilizes ${pct(p.r.trailerUtilization!)} of a ${fixed(trailerLenFt, 0)} ft trailer floor (${fixed(trailerLenFt - linearFtUsed, 1)} linear feet remaining).`,
        );
      } else {
        interp.push(
          `Exceeds the entered ${fixed(trailerLenFt, 0)} ft trailer length. ${fmt(p.r.unplacedUnits, 'count')} unit${p.r.unplacedUnits === 1 ? '' : 's'} do not fit.`,
        );
      }
    }

    interp.push(
      'Carrier thresholds and pricing rules vary. Many LTL carriers apply cubic capacity or linear foot rules (often between 10 and 20 linear feet) that invoke spot quotes or linear foot minimums.',
    );

    const stats = [
      {
        label: 'Linear feet occupied',
        value: `${fixed(linearFtUsed, 1)} ft`,
        hint: `${fixed(p.r.lengthUsed / 25.4, 0)} in / ${fixed(p.r.lengthUsed / 1000, 2)} m`,
      },
      {
        label: 'Trailer floor positions',
        value: fmt(p.r.floorPositions, 'count'),
        hint: p.r.effectiveStack > 1 ? `Stacked ${p.r.effectiveStack} high` : 'Single tier',
      },
      ...trailerCommonStats(p),
    ];

    return {
      ok: true,
      headline: {
        label: 'Trailer linear feet',
        value: `${fixed(linearFtUsed, 1)} ft`,
        sub: `${fmt(p.r.floorPositions, 'count')} floor positions · ${fixed(p.width / 25.4, 0)} in usable trailer width (planning preset)`,
      },
      stats,
      interpretation: interp,
      warnings: p.r.fits ? undefined : ['The shipment exceeds the entered trailer length.'],
      diagrams: [trailerDiagram(p, 'pallets')],
      assumptions: [
        'Linear feet measures trailer floor length occupied along the trailer axis from front to rear.',
        '96 in is a reference interior planning width; actual interior widths of North American dry vans range between 96 and 100 inches.',
        '53 ft (636 in) is a standard North American trailer reference length assumption; 28 ft pup trailers and 48 ft vans are also widely operated.',
        'GMA pallet dimensions (48 × 40 in) reflect the Grocery Manufacturers Association standard footprint.',
        'Items are arranged to minimize total floor length using 2D strip packing.',
        'Carrier linear-foot surcharges, cubic capacity rules, and minimum charge thresholds vary by carrier tariff.',
      ],
      links: [
        { href: '/loading-meter-calculator/', label: 'Compare with European Loading Metres (LDM)' },
        { href: '/pallet-calculator/', label: 'Calculate pallet layer patterns' },
      ],
    };
  },
};

export default spec;
