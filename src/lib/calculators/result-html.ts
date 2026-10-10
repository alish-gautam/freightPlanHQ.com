import { escapeHtml as e } from '../formatting';
import type { CalcResult } from './types';

/** Renders a calculation result. Used at build time and in the browser. SVG strings come from our own renderer. */
export function resultHtml(r: CalcResult): string {
  if (!r.ok) {
    return `<div class="result-errors" role="alert"><div class="result-alert-head"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg><span class="result-errors-title">Check your inputs</span></div><ul>${r.errors.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`;
  }
  const stats = r.stats.length
    ? `<dl class="stat-grid">${r.stats
        .map((s) => `<div class="stat"><dt>${e(s.label)}</dt><dd class="tabular-nums">${e(s.value)}${s.hint ? `<span class="stat-hint">${e(s.hint)}</span>` : ''}</dd></div>`)
        .join('')}</dl>`
    : '';
  const interp = r.interpretation.length
    ? `<div class="interpretation"><h3>What this means</h3><ul>${r.interpretation.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`
    : '';
  const warn = r.warnings?.length
    ? `<div class="result-warnings" role="note"><div class="result-alert-head"><svg viewBox="0 0 20 20" fill="currentColor" aria-hidden="true"><path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/></svg><span class="result-warnings-title">Important notice</span></div><ul>${r.warnings.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`
    : '';
  const assumptions = r.assumptions?.length
    ? `<div class="assumptions"><h3>Assumptions used</h3><ul>${r.assumptions.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`
    : '';
  const tables = (r.tables ?? [])
    .map(
      (t) =>
        `<div class="table-scroll" tabindex="0" role="region" aria-label="${e(t.caption)}"><table class="data-table"><caption>${e(t.caption)}</caption><thead><tr>${t.head.map((h) => `<th scope="col">${e(h)}</th>`).join('')}</tr></thead><tbody>${t.rows
          .map((row) => `<tr>${row.map((c, i) => (i === 0 ? `<th scope="row">${e(c)}</th>` : `<td>${e(c)}</td>`)).join('')}</tr>`)
          .join('')}</tbody></table></div>`,
    )
    .join('');
  const diagrams = (r.diagrams ?? [])
    .map((d) => `<figure class="diagram"><figcaption class="diagram-title">${e(d.title)}</figcaption><div class="diagram-body">${d.svg}</div>${d.caption ? `<p class="diagram-caption">${e(d.caption)}</p>` : ''}</figure>`)
    .join('');
  const links = r.links?.length
    ? `<p class="result-links">${r.links.map((l) => `<a class="text-link" href="${e(l.href)}" data-track="related_tool_clicked">${e(l.label)} →</a>`).join('')}</p>`
    : '';
  return `<div class="result-primary"><div class="result-primary-header"><span class="result-badge">Primary Result</span></div><p class="result-label">${e(r.headline.label)}</p><div class="result-value-wrap"><span class="result-value">${e(r.headline.value)}</span></div>${r.headline.sub ? `<p class="result-sub">${e(r.headline.sub)}</p>` : ''}</div>${warn}${stats}${interp}${diagrams}${tables}${assumptions}${links}`;
}

/** Plain-text summary for the copy button. */
export function resultText(r: CalcResult): string {
  if (!r.ok) return r.errors.join('\n');
  return [
    `${r.headline.label}: ${r.headline.value}${r.headline.sub ? ` (${r.headline.sub})` : ''}`,
    ...r.stats.map((s) => `${s.label}: ${s.value}`),
    ...r.interpretation,
  ].join('\n');
}
