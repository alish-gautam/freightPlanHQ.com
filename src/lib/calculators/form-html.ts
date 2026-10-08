import { escapeHtml as e } from '../formatting';
import type { CheckField, FieldDef, NumberField, RowsField, Section, SelectField } from './types';

/** Shared HTML generation for forms. Used at build time (SSR) and in the browser for added rows. */

export interface FormCtx {
  /** defaults of top-level selects, to show unit suffixes before JS runs */
  selectDefaults: Record<string, { label: string; value: string }>;
  selectOptions: Record<string, Record<string, string>>;
}

export function buildCtx(sections: Section[]): FormCtx {
  const selectDefaults: FormCtx['selectDefaults'] = {};
  const selectOptions: FormCtx['selectOptions'] = {};
  for (const s of sections)
    for (const f of s.fields)
      if (f.kind === 'select') {
        selectOptions[f.id] = Object.fromEntries(f.options.map((o) => [o.value, o.label]));
        selectDefaults[f.id] = { value: f.default, label: selectOptions[f.id][f.default] ?? f.default };
      }
  return { selectDefaults, selectOptions };
}

const showAttr = (f: { showIf?: FieldDef['showIf'] }) =>
  f.showIf ? ` data-show-field="${e(f.showIf.field)}" data-show-equals="${e([f.showIf.equals].flat().join('|'))}"` : '';

function numberHtml(f: NumberField, idPrefix: string, ctx: FormCtx, rowDefaults?: Record<string, number | string>, rowSelects?: Record<string, string>): string {
  const id = `${idPrefix}${f.id}`;
  const val = rowDefaults && f.id in rowDefaults ? rowDefaults[f.id] : f.default ?? '';
  let suffix = f.suffix ?? '';
  let unitFrom = '';
  if (f.unitFrom) {
    unitFrom = f.unitFrom;
    const sel = rowSelects?.[f.unitFrom];
    suffix = sel ? (ctx.selectOptions[f.unitFrom]?.[sel] ?? sel) : (ctx.selectDefaults[f.unitFrom]?.label ?? '');
  }
  const help = f.help ? `<p class="field-help" id="${id}-help">${e(f.help)}</p>` : '';
  const step = f.step === undefined ? (f.integer ? '1' : 'any') : String(f.step);
  return `<div class="field"${showAttr(f)} data-field="${e(f.id)}">
  <label for="${id}">${e(f.label)}${f.optional ? ' <span class="optional">(optional)</span>' : ''}</label>
  <div class="input-wrap"><input id="${id}" name="${id}" type="number" inputmode="decimal" step="${step}"${f.min !== undefined ? ` min="${f.min}"` : ''} value="${e(String(val))}" data-kind="number" data-id="${e(f.id)}"${f.integer ? ' data-integer="1"' : ''}${f.help ? ` aria-describedby="${id}-help"` : ''}${unitFrom ? ` data-unit-from="${e(unitFrom)}"` : ''}>${suffix || unitFrom ? `<span class="suffix" data-suffix-for="${id}">${e(suffix)}</span>` : ''}</div>${help}</div>`;
}

function selectHtml(f: SelectField, idPrefix: string, rowDefaults?: Record<string, number | string>): string {
  const id = `${idPrefix}${f.id}`;
  const cur = rowDefaults && f.id in rowDefaults ? String(rowDefaults[f.id]) : f.default;
  const help = f.help ? `<p class="field-help" id="${id}-help">${e(f.help)}</p>` : '';
  return `<div class="field"${showAttr(f)} data-field="${e(f.id)}">
  <label for="${id}">${e(f.label)}</label>
  <select id="${id}" name="${id}" data-kind="select" data-id="${e(f.id)}"${f.help ? ` aria-describedby="${id}-help"` : ''}>${f.options
    .map((o) => `<option value="${e(o.value)}"${o.value === cur ? ' selected' : ''}>${e(o.label)}</option>`)
    .join('')}</select>${help}</div>`;
}

function checkHtml(f: CheckField): string {
  const id = `f-${f.id}`;
  const help = f.help ? `<p class="field-help" id="${id}-help">${e(f.help)}</p>` : '';
  return `<div class="field field-check"${showAttr(f)} data-field="${e(f.id)}">
  <label class="check"><input id="${id}" name="${id}" type="checkbox" data-kind="check" data-id="${e(f.id)}"${f.default ? ' checked' : ''}${f.help ? ` aria-describedby="${id}-help"` : ''}> <span>${e(f.label)}</span></label>${help}</div>`;
}

export function rowHtml(f: RowsField, index: number, ctx: FormCtx, defaults: Record<string, number | string>): string {
  const prefix = `f-${f.id}-${index}-`;
  const rowSelects: Record<string, string> = {};
  for (const c of f.columns) if (c.kind === 'select') rowSelects[c.id] = String(defaults[c.id] ?? c.default);
  const cols = f.columns
    .map((c) => (c.kind === 'number' ? numberHtml(c, prefix, ctx, defaults, rowSelects) : selectHtml(c, prefix, defaults)))
    .join('');
  return `<div class="row-card" data-row="${index}" role="group" aria-label="${e(f.itemLabel)} ${index + 1}">
  <div class="row-head"><span class="row-title">${e(f.itemLabel)} <span data-row-number>${index + 1}</span></span><button type="button" class="btn btn-ghost btn-sm" data-remove-row aria-label="Remove ${e(f.itemLabel.toLowerCase())} ${index + 1}">Remove</button></div>
  <div class="row-grid">${cols}</div>
</div>`;
}

function rowsHtml(f: RowsField, ctx: FormCtx): string {
  return `<fieldset class="rows" data-rows="${e(f.id)}" data-max="${f.max}"${showAttr(f)}>
  <legend>${e(f.label)}</legend>${f.help ? `<p class="field-help">${e(f.help)}</p>` : ''}
  <div class="rows-list" data-rows-list>${f.defaults.map((d, i) => rowHtml(f, i, ctx, d)).join('')}</div>
  <button type="button" class="btn btn-secondary btn-sm" data-add-row>${e(f.addLabel)}</button>
</fieldset>`;
}

export function fieldHtml(f: FieldDef, ctx: FormCtx): string {
  switch (f.kind) {
    case 'number':
      return numberHtml(f, 'f-', ctx);
    case 'select':
      return selectHtml(f, 'f-');
    case 'check':
      return checkHtml(f);
    case 'rows':
      return rowsHtml(f, ctx);
  }
}

export function sectionsHtml(sections: Section[]): string {
  const ctx = buildCtx(sections);
  const render = (s: Section) =>
    `${s.title ? `<h3 class="form-section-title">${e(s.title)}</h3>` : ''}${s.description ? `<p class="field-help">${e(s.description)}</p>` : ''}<div class="form-grid">${s.fields.map((f) => fieldHtml(f, ctx)).join('')}</div>`;
  const basic = sections.filter((s) => !s.advanced);
  const adv = sections.filter((s) => s.advanced);
  return (
    basic.map((s) => `<div class="form-section">${render(s)}</div>`).join('') +
    (adv.length
      ? `<details class="advanced" data-advanced><summary>Advanced options</summary>${adv.map((s) => `<div class="form-section">${render(s)}</div>`).join('')}</details>`
      : '')
  );
}
