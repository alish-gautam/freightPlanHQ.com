import { dimPresets } from '../../carrier-rules';
import type { CalculatorSpec } from '../types';
import { computeDim, dimSections } from './dim-shared';

const spec: CalculatorSpec = {
  sections: dimSections(dimPresets, dimPresets[1], { l: 50, w: 40, h: 30, unit: 'cm', qty: 1, weight: 5 }, { rows: 'Packages', item: 'Package', addLabel: 'Add another package size', weight: 'Actual weight of one package' }),
  compute: (v) => computeDim(v, { presets: dimPresets, kind: 'dim' }),
};
export default spec;
