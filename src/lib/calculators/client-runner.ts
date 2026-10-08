import { buildCtx, rowHtml } from './form-html';
import { resultHtml, resultText } from './result-html';
import type { CalculatorSpec, RowsField, Values, RowValues } from './types';

export function initCalculator(spec: CalculatorSpec, rootEl: HTMLElement) {
  const form = rootEl.querySelector<HTMLFormElement>('form[data-calculator-form]');
  const resultTarget = rootEl.querySelector<HTMLElement>('#calc-result-target');
  const copyBtn = rootEl.querySelector<HTMLButtonElement>('[data-copy-result]');
  const resetBtn = rootEl.querySelector<HTMLButtonElement>('[data-reset-calc]');

  if (!form || !resultTarget) return;

  const ctx = buildCtx(spec.sections);

  // Map of select fills from spec
  const selectFills: Record<string, Record<string, Record<string, number | string | boolean>>> = {};
  const rowsFieldDefs: Record<string, RowsField> = {};

  for (const s of spec.sections) {
    for (const f of s.fields) {
      if (f.kind === 'select' && f.fills) {
        selectFills[f.id] = f.fills;
      }
      if (f.kind === 'rows') {
        rowsFieldDefs[f.id] = f;
      }
    }
  }

  function getFormValues(): Values {
    const values: Values = {};

    // 1. Top-level number, select, and check fields
    const inputs = form!.querySelectorAll<HTMLInputElement | HTMLSelectElement>(
      'input[data-id], select[data-id], textarea[data-id]',
    );

    inputs.forEach((el) => {
      // Exclude row children which have prefixes
      if (el.closest('.row-card')) return;

      const id = el.dataset.id;
      if (!id) return;

      const kind = el.dataset.kind;
      if (kind === 'number') {
        const val = el.value.trim();
        values[id] = val === '' ? null : Number(val);
      } else if (kind === 'select') {
        values[id] = el.value;
      } else if (kind === 'check') {
        values[id] = (el as HTMLInputElement).checked;
      }
    });

    // 2. Rows fields
    for (const [rowsId] of Object.entries(rowsFieldDefs)) {
      const container = form!.querySelector<HTMLElement>(`[data-rows="${rowsId}"]`);
      if (!container) continue;

      const rowCards = container.querySelectorAll<HTMLElement>('.row-card');
      const rowList: RowValues[] = [];

      rowCards.forEach((rc) => {
        const rowVal: RowValues = {};
        const rowInputs = rc.querySelectorAll<HTMLInputElement | HTMLSelectElement>('[data-id]');
        rowInputs.forEach((ri) => {
          const fid = ri.dataset.id;
          if (!fid) return;
          const k = ri.dataset.kind;
          if (k === 'number') {
            const v = ri.value.trim();
            rowVal[fid] = v === '' ? null : Number(v);
          } else if (k === 'select') {
            rowVal[fid] = ri.value;
          }
        });
        rowList.push(rowVal);
      });

      values[rowsId] = rowList;
    }

    return values;
  }

  let latestResult = spec.compute(getFormValues());

  function updateVisibility(vals: Values) {
    const conditionalEls = form!.querySelectorAll<HTMLElement>('[data-show-field]');
    conditionalEls.forEach((el) => {
      const fieldId = el.dataset.showField!;
      const expected = (el.dataset.showEquals || '').split('|');
      const currentVal = String(vals[fieldId] ?? '');
      const visible = expected.includes(currentVal);
      el.style.display = visible ? '' : 'none';
    });
  }

  function updateSuffixes() {
    const unitSelects = form!.querySelectorAll<HTMLSelectElement>('select[data-id]');
    unitSelects.forEach((sel) => {
      const selectId = sel.dataset.id!;
      const selectedOption = sel.options[sel.selectedIndex];
      const label = selectedOption ? selectedOption.text : sel.value;

      const targets = form!.querySelectorAll<HTMLElement>(`[data-suffix-for]`);
      targets.forEach((suff) => {
        const inputId = suff.dataset.suffixFor!;
        const input = form!.querySelector<HTMLInputElement>(`#${inputId}`);
        if (input && input.dataset.unitFrom === selectId) {
          suff.textContent = label;
        }
      });
    });
  }

  function recalculate() {
    const vals = getFormValues();
    updateVisibility(vals);
    updateSuffixes();
    latestResult = spec.compute(vals);
    resultTarget!.innerHTML = resultHtml(latestResult);
  }

  // Handle select presets that fill other fields
  form.addEventListener('change', (e) => {
    const target = e.target as HTMLElement;
    if (target.matches('select[data-id]')) {
      const sel = target as HTMLSelectElement;
      const selectId = sel.dataset.id!;
      const val = sel.value;

      if (selectFills[selectId]?.[val]) {
        const fills = selectFills[selectId][val];
        for (const [fillField, fillVal] of Object.entries(fills)) {
          const input = form!.querySelector<HTMLInputElement | HTMLSelectElement>(
            `[data-id="${fillField}"]:not(.row-card [data-id])`,
          );
          if (input) {
            if (input.type === 'checkbox') {
              (input as HTMLInputElement).checked = Boolean(fillVal);
            } else {
              input.value = String(fillVal);
            }
          }
        }
      }
    }
    recalculate();
  });

  form.addEventListener('input', () => {
    recalculate();
  });

  // Handle row add/remove
  form.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest('button');
    if (!btn) return;

    if (btn.hasAttribute('data-add-row')) {
      const fieldset = btn.closest<HTMLElement>('fieldset[data-rows]');
      if (!fieldset) return;
      const rowsId = fieldset.dataset.rows!;
      const def = rowsFieldDefs[rowsId];
      if (!def) return;

      const list = fieldset.querySelector<HTMLElement>('[data-rows-list]');
      const max = Number(fieldset.dataset.max || 30);
      const currentCount = list ? list.children.length : 0;
      if (currentCount >= max) return;

      const defaultRow = def.defaults[0] ?? {};
      const newHtml = rowHtml(def, currentCount, ctx, defaultRow);
      list?.insertAdjacentHTML('beforeend', newHtml);
      recalculate();
    } else if (btn.hasAttribute('data-remove-row')) {
      const card = btn.closest<HTMLElement>('.row-card');
      const list = card?.parentElement;
      if (card && list) {
        if (list.children.length > 1) {
          card.remove();
          // renumber remaining rows
          list.querySelectorAll<HTMLElement>('.row-card').forEach((rc, i) => {
            const numEl = rc.querySelector<HTMLElement>('[data-row-number]');
            if (numEl) numEl.textContent = String(i + 1);
          });
          recalculate();
        }
      }
    }
  });

  // Reset button
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      form.reset();
      recalculate();
    });
  }

  // Copy result button
  if (copyBtn) {
    copyBtn.addEventListener('click', async () => {
      try {
        const text = resultText(latestResult);
        await navigator.clipboard.writeText(text);
        const originalText = copyBtn.textContent;
        copyBtn.textContent = 'Copied!';
        setTimeout(() => {
          copyBtn.textContent = originalText;
        }, 2000);
      } catch {
        // fallback
      }
    });
  }

  // Initial visibility sync
  updateVisibility(getFormValues());
}
