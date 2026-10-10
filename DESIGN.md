# FreightPlanHQ Design System Specification

## 1. Visual Identity & Brand Philosophy
- **Brand**: FreightPlanHQ (FP)
- **Positioning**: Professional, technical, deterministic logistics & cargo planning utility platform.
- **Inspiration & Quality Benchmark**: PaverPlan (structured information hierarchy, clean forms, auditable calculations, restrained density, high readability).
- **Core Principle**: Tool-first, calm, industrial/maritime logistics aesthetic. Zero flashy gradients, zero cartoonish pill cards, zero generic SaaS decoration.
- **Icon / Brand Mark**: 3D Isometric Cargo Container Planning Cube with modular top deck, container side corrugations, and safety amber inspection tag.

## 2. Color System & Tokens (CSS Variables)

### Light Mode
- `--canvas`: `#f8fafc` — Crisp neutral-slate page background
- `--canvas-elevated`: `#ffffff` — Card, header, elevated surface
- `--surface-card`: `#ffffff` — Calculator container surface
- `--surface-subtle`: `#f1f5f9` — Fieldsets, input suffixes, table headers, insets
- `--surface-result`: `#f8fafc` — Result panel background
- `--surface-result-primary`: `#0f172a` — Deep slate-900 primary hero output
- `--surface-result-primary-text`: `#ffffff`
- `--ink`: `#0f172a` — Primary text (contrast > 13:1, WCAG AAA)
- `--body`: `#334155` — Secondary body copy (contrast > 8:1)
- `--mute`: `#64748b` — Helper text, labels (contrast > 4.6:1, WCAG AA)
- `--faint`: `#94a3b8` — Subtle metadata
- `--hairline`: `#e2e8f0` — Standard borders
- `--hairline-strong`: `#cbd5e1` — High-contrast form borders
- `--hairline-subtle`: `#f1f5f9`
- `--accent`: `#2563eb` — Primary brand / interactive action (blue 600)
- `--accent-hover`: `#1d4ed8`
- `--accent-soft`: `#eff6ff`
- `--accent-border`: `#bfdbfe`
- `--accent-text`: `#1d4ed8`
- `--success`: `#15803d` / `--success-soft`: `#f0fdf4`
- `--warning`: `#b45309` / `--warning-soft`: `#fffbeb`
- `--error`: `#b91c1c` / `--error-soft`: `#fef2f2`
- `--focus-ring`: `#2563eb`

### Dark Mode (Genuinely Separate Accessible Palette)
- `--canvas`: `#090d16` — Deep neutral dark background
- `--canvas-elevated`: `#111827` — Header, main containers, cards
- `--surface-card`: `#141d2e` — Distinctly elevated calculator cards
- `--surface-subtle`: `#192337` — Inputs, row cards, suffix badges
- `--surface-result`: `#0f1728` — Result panel
- `--surface-result-primary`: `#172554` — High-contrast navy 950 hero card
- `--surface-result-primary-text`: `#f8fafc`
- `--ink`: `#f8fafc` — High-contrast text (contrast > 15:1)
- `--body`: `#cbd5e1` — Secondary body text (contrast > 9:1)
- `--mute`: `#94a3b8` — Muted text (contrast > 5.5:1)
- `--faint`: `#64748b`
- `--hairline`: `#26334a` — Visible, distinct slate borders
- `--hairline-strong`: `#3b4e6d` — Visible form input borders
- `--hairline-subtle`: `#182234`
- `--accent`: `#3b82f6` — High-contrast bright blue
- `--accent-hover`: `#60a5fa`
- `--accent-soft`: `rgba(59, 130, 246, 0.15)`
- `--accent-border`: `rgba(59, 130, 246, 0.4)`
- `--accent-text`: `#60a5fa`
- `--success`: `#22c55e` / `--success-soft`: `rgba(34, 197, 94, 0.14)`
- `--warning`: `#f59e0b` / `--warning-soft`: `rgba(245, 158, 11, 0.14)`
- `--error`: `#ef4444` / `--error-soft`: `rgba(239, 68, 68, 0.14)`
- `--focus-ring`: `#60a5fa`

## 3. Typography Hierarchy
- **Font Stack**: System sans (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`)
- **Mono Stack**: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", monospace`
- **Numerals**: `tabular-nums` on all calculated numeric outputs.
- **H1 Scale**: 2rem (mobile) to 2.5rem–3rem (desktop)
- **H2 Scale**: 1.25rem to 1.75rem
- **Body**: 0.875rem (14px) with 1.5 line-height
- **Labels**: 0.8125rem (13px), font-weight 600

## 4. Calculator & Form Component Specifications
- **Section Headers**: Numbered badges (`1`, `2`, `3`) with clear title and concise description.
- **Form Inputs**: 40px–42px consistent height, integrated suffix pills (`[ 12.5 ][ ft ]`), visible `:focus-visible` ring.
- **Presets**: Segmented controls with distinct active state (border + background + text contrast).
- **Primary Hero Result**: Large 2.5rem value, tabular numerals, clear unit, short interpretation.
- **Stat Grid**: Compact `dt`/`dd` cards for secondary outputs.
- **Warnings & Errors**: Dual signaling (Icon SVG + bold title + descriptive text), never relying on color alone.
- **Audit Trail**: Step-by-step numbered breakdown with formula blocks.

## 5. Accessibility & Motion
- WCAG AA contrast compliance across both light and dark themes.
- Fully keyboard-accessible controls and theme toggler.
- `prefers-reduced-motion` strictly honored for all transitions.
