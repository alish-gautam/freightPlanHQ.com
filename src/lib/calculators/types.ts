/**
 * Calculator UI contract.
 * A spec defines the form (sections/fields) and a pure `compute(values)` function.
 * The same spec is rendered to HTML at build time (so results are visible without JS)
 * and hydrated by a small client script. Math lives in src/lib/calculations, not here.
 */
export interface Option {
  value: string;
  label: string;
}

interface BaseField {
  id: string;
  label: string;
  help?: string;
  /** show only when another field has one of these values */
  showIf?: { field: string; equals: string | string[] };
}

export interface NumberField extends BaseField {
  kind: 'number';
  default?: number | string;
  /** id of a select (row-level first, then top-level) whose label is shown as the unit */
  unitFrom?: string;
  /** static unit text */
  suffix?: string;
  optional?: boolean;
  step?: number | 'any';
  min?: number;
  integer?: boolean;
}

export interface SelectField extends BaseField {
  kind: 'select';
  options: Option[];
  default: string;
  /** selecting an option sets other fields (values must match field kinds) */
  fills?: Record<string, Record<string, number | string | boolean>>;
}

export interface CheckField extends BaseField {
  kind: 'check';
  default: boolean;
}

export interface RowsField extends BaseField {
  kind: 'rows';
  addLabel: string;
  itemLabel: string;
  max: number;
  columns: (NumberField | SelectField)[];
  defaults: Record<string, number | string>[];
}

export type FieldDef = NumberField | SelectField | CheckField | RowsField;

export interface Section {
  title?: string;
  description?: string;
  /** rendered inside a collapsed "Advanced options" disclosure */
  advanced?: boolean;
  fields: FieldDef[];
}

export type RowValues = Record<string, number | string | null>;
export type Values = Record<string, number | string | boolean | null | RowValues[]>;

export interface Stat {
  label: string;
  value: string;
  hint?: string;
}

export interface TableOut {
  caption: string;
  head: string[];
  rows: string[][];
}

export interface DiagramOut {
  title: string;
  svg: string;
  caption?: string;
}

export interface ResultOk {
  ok: true;
  headline: { label: string; value: string; sub?: string };
  stats: Stat[];
  /** plain-language reading of the result */
  interpretation: string[];
  /** assumptions actually used in this computation */
  assumptions?: string[];
  warnings?: string[];
  tables?: TableOut[];
  diagrams?: DiagramOut[];
  links?: { href: string; label: string }[];
}
export interface ResultErr {
  ok: false;
  errors: string[];
}
export type CalcResult = ResultOk | ResultErr;

export interface CalculatorSpec {
  sections: Section[];
  compute(values: Values): CalcResult;
}

export const fail = (errors: string[]): ResultErr => ({ ok: false, errors });
