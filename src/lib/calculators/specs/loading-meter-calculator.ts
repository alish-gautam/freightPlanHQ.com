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

const spec: CalculatorSpec = {
  sections: trailerSections({
    unit: 'cm',
    trailerW: 240,
    trailerL: 1360,
    item: { l: 120, w: 80, h: 140 },
    qty: 10,
    presetDefault: 'eur',
    widthLabel: 'Usable trailer width (forwarder planning reference: 240 cm / 2.4 m)',
    lengthLabel: 'Trailer internal length (reference semi-trailer assumption: 1360 cm / 13.6 m)',
    presetFillUnit: 'cm',
  }),
  compute(v): CalcResult {
    const c = new Checker();
    const p = parseTrailer(v, c);
    if ('error' in p) return failFrom(p);

    const ldmUsed = p.r.lengthUsed / 1000;
    const ldmArea = p.r.areaBasisLength / 1000;
    const trailerLenM = p.length !== null ? p.length / 1000 : null;

    const interp: string[] = [
      `This layout requires ${fixed(ldmUsed, 2)} loading metres (LDM) of trailer floor length for ${fmt(p.qty, 'count')} handling units (${fmt(p.r.floorPositions, 'count')} floor positions).`,
      `On a pure footprint area basis across the ${fixed(p.width / 1000, 2)} m trailer width, the cargo equals ${fixed(ldmArea, 2)} LDM. The difference reflects row spacing and floor geometry.`,
    ];

    if (p.r.effectiveStack > 1) {
      interp.push(
        `Freight is stacked ${p.r.effectiveStack} high, cutting floor space from ${p.qty} positions to ${p.r.floorPositions}.`,
      );
    }
    if (p.r.stackNote) interp.push(p.r.stackNote);

    if (trailerLenM !== null) {
      if (p.r.fits) {
        interp.push(
          `Fits within the entered ${fixed(trailerLenM, 2)} m trailer length (${pct(p.r.trailerUtilization!)} used, ${fixed(trailerLenM - ldmUsed, 2)} m remaining).`,
        );
      } else {
        interp.push(
          `Does NOT fit within the entered ${fixed(trailerLenM, 2)} m trailer length. ${fmt(p.r.unplacedUnits, 'count')} units exceed trailer capacity.`,
        );
      }
    }

    interp.push(
      'Loading metres (LDM) is a European road freight planning convention. Carrier tariffs, minimum billable LDM rules, and equipment dimensions vary.',
    );

    const stats = [
      {
        label: 'Floor length (physical LDM)',
        value: `${fixed(ldmUsed, 2)} LDM`,
        hint: `${fixed(p.r.lengthUsed / 100, 1)} cm`,
      },
      {
        label: 'Area-basis LDM',
        value: `${fixed(ldmArea, 2)} LDM`,
        hint: `Floor area ÷ ${fixed(p.width / 1000, 2)} m trailer width`,
      },
      ...trailerCommonStats(p),
    ];

    return {
      ok: true,
      headline: {
        label: 'Loading metres (LDM)',
        value: `${fixed(ldmUsed, 2)} LDM`,
        sub: `${fmt(p.r.floorPositions, 'count')} floor positions · ${fixed(p.width / 1000, 2)} m trailer width (planning reference)`,
      },
      stats,
      interpretation: interp,
      warnings: p.r.fits ? undefined : [`The freight exceeds the entered trailer length.`],
      diagrams: [trailerDiagram(p, 'items')],
      assumptions: [
        '1 LDM = 1 metre of trailer length across the full usable trailer width.',
        '2.4 m usable width is a standard European freight forwarding planning reference, not an official equipment specification.',
        '13.6 m trailer length is a common European curtain-side / box semi-trailer planning reference assumption.',
        'Euro pallet dimensions (120 × 80 cm) follow the standard EPAL EUR 1 specification.',
        'Items are arranged to minimise occupied trailer length using deterministic 2D packing.',
        'Stackability assumes uniform, stable cargo and legal axle weight compliance.',
      ],
      links: [
        { href: '/linear-feet-calculator/', label: 'Compare with U.S./Canada Linear Feet' },
        { href: '/guides/standard-pallet-sizes/', label: 'Standard pallet dimensions reference' },
      ],
    };
  },
};

export default spec;
