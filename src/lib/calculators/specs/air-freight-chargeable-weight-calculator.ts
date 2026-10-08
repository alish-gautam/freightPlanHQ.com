import { airPresets } from '../../carrier-rules';
import type { CalculatorSpec } from '../types';
import { computeDim, dimSections } from './dim-shared';

const spec: CalculatorSpec = {
  sections: dimSections(airPresets, airPresets[0], { l: 120, w: 80, h: 100, unit: 'cm', qty: 2, weight: 150 }, { rows: 'Pieces', item: 'Piece', addLabel: 'Add another piece size', weight: 'Gross weight of one piece' }),
  compute: (v) => computeDim(v, { presets: airPresets, kind: 'air' }),
};
export default spec;
