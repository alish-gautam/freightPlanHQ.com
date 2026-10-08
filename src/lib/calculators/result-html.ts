import { escapeHtml as e } from '../formatting';
import type { CalcResult } from './types';

/** Renders a calculation result. Used at build time and in the browser. SVG strings come from our own renderer. */
export function resultHtml(r: CalcResult): string {
  if (!r.ok) {
    return `<div class="result-errors" role="alert"><p class="result-errors-title">Check your inputs</p><ul>${r.errors.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`;
  }
  const stats = r.stats.length
    ? `<dl class="stat-grid">${r.stats
        .map((s) => `<div class="stat"><dt>${e(s.label)}</dt><dd>${e(s.value)}</dd>${s.hint ? `<p class="stat-hint">${e(s.hint)}</p>` : ''}</div>`)
        .join('')}</dl>`
    : '';
  const interp = r.interpretation.length
    ? `<div class="interpretation"><h3>What this means</h3><ul>${r.interpretation.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`
    : '';
  const warn = r.warnings?.length
    ? `<div class="result-warnings" role="note"><p class="result-warnings-title">Check this</p><ul>${r.warnings.map((m) => `<li>${e(m)}</li>`).join('')}</ul></div>`
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
  return `<div class="result-primary"><p class="result-label">${e(r.headline.label)}</p><p class="result-value">${e(r.headline.value)}</p>${r.headline.sub ? `<p class="result-sub">${e(r.headline.sub)}</p>` : ''}</div>${warn}${stats}${interp}${diagrams}${tables}${assumptions}${links}`;
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
