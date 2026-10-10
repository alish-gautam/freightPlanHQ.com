# FreightPlanHQ — Final Residual Defects and Evidence Audit

**Audit Date:** 2026-10-10  
**Deployment Target:** https://freightplanhq.com (Pending Purchase & Configuration)  
**Preview Deployment Mode:** https://master.freightplanhq.pages.dev/ (`noindex, nofollow`, canonicals suppressed)  
**Framework:** Astro 7.3.5 / Tailwind CSS v4.3.3 / TypeScript 6.0.3 / Vitest 5.0.3  
**Hosting Environment:** Cloudflare Pages (static HTML output)  

---

## 1. Tooling & Verification Pipeline Output

All verification commands were executed directly against the repository source files, test fixtures, and built distribution files:

| Verification Action | Command Executed | Result / Exit Code | Evidence Summary |
| :--- | :--- | :---: | :--- |
| **Unit & Regression Tests** | `npm test` (`vitest run`) | **Passed (0)** | 10 test files, **327 tests passed** (verified 3-value dimensional weight separation and USPS overweight physical parcel validation), 0 failures, 1.49s execution time. |
| **Type & Diagnostic Check** | `npm run check` (`astro check`) | **Passed (0)** | 76 files checked: **0 errors, 0 warnings, 0 hints**. |
| **Production Build** | `$env:PUBLIC_SITE_URL="https://freightplanhq.com"; npm run build` | **Passed (0)** | **43 routes built** (plus `/404.html`), sitemap generated with 42 canonical routes in 1.41s. |
| **Preview Metadata Verification** | `$env:PREVIEW_MODE="true"; npm run build` | **Passed (0)** | Validated: emitted `<meta name="robots" content="noindex, nofollow">`, suppressed canonical tags. |
| **Full Browser & A11y QA** | `node qa-audit.cjs` (Headless Chromium) | **Passed (0)** | 14/14 calculators reactive, 156 responsive combinations (0 overflows), **0 axe-core a11y violations across 10 templates**, 0 console errors. |

---

## 2. Remediation of Residual Defects

### 2.1 USPS Adjustment Factor and Threshold Order
- **Adjustment Factor:** Corrected from mathematical $\pi/4 \approx 0.7854$ to the exact source-defined USPS Domestic Mail Manual (DMM) factor of **`0.785`** across all engines, presets, specs, and reference copy (`src/lib/calculations/dimensional-weight.ts`, `src/lib/carrier-rules/index.ts`, `src/lib/calculators/specs/dim-shared.ts`, `src/lib/sources/index.ts`, `src/lib/guides/registry.ts`).
- **Verified Primary Sources:**
  - Retail Priority Mail: [USPS DMM 123.1.3](https://pe.usps.com/text/DMM300/123.htm)
  - Commercial Priority Mail: [USPS DMM 223.1.4](https://pe.usps.com/text/DMM300/223.htm)
  - Retail Priority Mail Express: [USPS DMM 113.1.3](https://pe.usps.com/text/DMM300/113.htm)
  - Commercial Priority Mail Express: [USPS DMM 213.1.4](https://pe.usps.com/text/DMM300/213.htm)
- **Order of Operations:**
  1. Measure exterior dimensions in inches and round each dimension up to the next whole inch (ceiling).
  2. Compute raw cubic volume ($L \times W \times H$).
  3. For nonrectangular parcels, multiply raw volume by **`0.785`** to obtain the adjusted volume.
  4. Compare adjusted volume against the **1,728 cubic inches** threshold ($1\text{ cu ft}$).
  5. If adjusted volume $\le 1,728\text{ in}^3$, dimensional weight is **not applicable ($0\text{ lb}$)**; actual scale weight governs rating.
  6. If adjusted volume $> 1,728\text{ in}^3$, divide by the service divisor and round up to the next whole pound:
     - Retail Priority Mail: Divisor **139** for both rectangular and nonrectangular.
     - Commercial Priority Mail: Divisor **139** for rectangular; Divisor **166** for nonrectangular.
     - Retail & Commercial Priority Mail Express: Divisor **139** for both shapes.
  7. Compare rounded dimensional weight with rounded actual scale weight; the greater value determines the rated billable weight.

### 2.2 Dimensional-Weight Rounding & Separation of Three Distinct Values
- **Identified Defect:**
  Previously, `calculateBillableWeight()` stored the raw unrounded quotient ($27,000 / 139 = 194.2446...\text{ lb}$) directly in `totalDimensional`, causing the UI to display `194.24 lb` as the calculated dimensional weight rather than the $195\text{ lb}$ mandated by USPS DMM 123.1.3.2 / 223.1.4.2 (which explicitly instructs to round fractional pounds up to the next whole pound).
- **Separation of Three Distinct Values:**
  The calculation engine (`src/lib/calculations/dimensional-weight.ts`) and calculator spec (`src/lib/calculators/specs/dim-shared.ts`) now compute and preserve all three separate values:
  1. **Unrounded Quotient (`totalUnroundedDimensional`):** The exact mathematical quotient of package volume divided by the service divisor (e.g., $27,000 / 139 = 194.2446...\text{ lb}$).
  2. **Calculated Dimensional Weight (`totalDimensional`):** The dimensional weight rounded up to the applicable service weight increment per DMM standards (e.g., ceiling to $195.00\text{ lb}$ for whole-pound rules, or half-then-whole for Express).
  3. **Rated Price Tier (`billable`):** The governing billable weight, legitimately capped at $70\text{ lb}$ per DMM 123.1.3 & 223.1.4 when calculated dimensional weight exceeds $70\text{ lb}$ and physical scale weight is eligible ($\le 70\text{ lb}$).
- **UI & Presentation Clarity:**
  - Headline displays Rated Billable Weight (e.g., `70.00 lb`).
  - Stats display Measured Actual (`15.00 lb`), Calculated Dimensional (`195.00 lb`), and Rated Billable (`70.00 lb`).
  - Stat hint retains the unrounded quotient separately: `Unrounded quotient: 194.24 lb`.
  - Result table explicitly breaks down all columns: `Row`, `Pieces`, `Measured Actual`, `Unrounded Quotient`, `Calculated Dimensional`, `Rated Billable`, and `Governing Weight`.

### 2.3 Physical Scale Weight Limits & USPS Service Eligibility Validation
- **Identified Defect:**
  Previously, `maxRatedWeight: 70` was applied unconditionally to the greater of actual scale weight and dimensional weight. If a user entered a physical parcel weighing $75\text{ lb}$, the engine silently capped rated weight to $70\text{ lb}$, misrepresenting an overweight, nonmailable physical parcel as eligible for the 70 lb rate. Under USPS DMM 101.3.1, 123.1.2, and 223.1.2, physical parcels exceeding $70\text{ lb}$ actual weight cannot be mailed via USPS Priority Mail or Express.
- **Engine & Validation Remediation:**
  - Added `maxScaleWeight: 70` to all USPS presets (`usps-commercial-priority`, `usps-retail-priority`, `usps-priority-express`) in `src/lib/carrier-rules/index.ts`.
  - Updated `calculateBillableWeight()` in `src/lib/calculations/dimensional-weight.ts`:
    - The $70\text{ lb}$ pricing tier cap is only applied when actual scale weight is eligible ($\le 70\text{ lb}$) and dimensional weight exceeds $70\text{ lb}$.
    - When actual physical scale weight exceeds $70\text{ lb}$, the output is **not silently capped at 70 lb** (e.g., $75\text{ lb}$ actual weight outputs $75\text{ lb}$ rated), and the result flags `isOverweight = true`.
  - Updated `describeBasis()`: When overweight, returns clear notice: *"Actual scale weight (75.00 lb) exceeds the 70 lb service limit (USPS DMM 101.3.1 / 123.1.2 / 223.1.2). Package is ineligible for standard service."*
  - Updated `computeDim()` in `src/lib/calculators/specs/dim-shared.ts`:
    - Displays a prominent `Service ineligibility warning`: *"Package actual scale weight (75.00 lb) exceeds the maximum allowable 70 lb service limit for USPS Priority Mail (DMM 101.3.1 / 123.1.2 / 223.1.2). USPS Priority Mail and Express services do not accept packages exceeding 70 lb actual physical weight. Overweight physical packages must be shipped via freight or an alternative carrier and are not eligible for the 70 lb dimensional pricing cap."*
    - Headline subtitle marks status: `Ineligible — actual scale weight exceeds 70 lb service limit`.
  - **Carrier Isolation:** Non-USPS presets (UPS Daily, FedEx Domestic) are unaffected; 75 lb physical parcels on UPS/FedEx are rated normally under their respective 150 lb limits without USPS caps or warnings.

### 2.4 FedEx Domestic Presets & Dimension Rounding
- **Source Verification:** Added direct source record `fedex-dim-guidance` referencing official [FedEx Dimensional Weight Guidance](https://www.fedex.com/en-us/shipping/packaging/what-is-dimensional-weight.html).
- **Rounding Rule:** FedEx packaging standards specify rounding each measured dimension to the **nearest whole inch** ($10.4\text{ in} \to 10\text{ in}$, $10.5\text{ in} \to 11\text{ in}$), unlike USPS/UPS which round *up* (ceiling).
- **Engine Support:** Implemented `dimensionRounding: 'none' | 'up' | 'nearest'` in `dimensional-weight.ts` and wired into `carrier-rules/index.ts` and calculator specs.

### 2.5 LTL Linear Feet Guide Review
- **File:** `src/lib/guides/registry.ts` (`ltl-linear-feet-explained`).
- **Mathematical Derivations & Assumptions:**
  - Standard GMA Pallet ($48 \times 40\text{ in}$):
    - Straight loading (lengthwise, 2 across): deck width $80\text{ in} \le 96\text{–}102\text{ in}$, physical depth $= 48\text{ in} = 4.00\text{ linear ft}$ per row.
    - Turned loading (widthwise, 2 across): deck width $96\text{ in} \le 102\text{ in}$ trailer, physical depth $= 40\text{ in} = 3.33\text{ linear ft}$ per row.
    - Alternating Pinwheeled Loading: Each nested pair of rows alternates orientations (Row A: $48+40$; Row B: $40+48$). The combined physical depth of two nested pinwheeled rows ($4\text{ pallets}$) is $48 + 40 = 88\text{ in} = 7.33\text{ ft}$. The **average** depth per two-pallet row is $7.33 / 2 = 3.67\text{ linear ft}$. The guide explicitly clarifies that $3.67\text{ ft}$ is an alternating average, not the physical deck depth of an isolated single row ($4.00\text{ ft}$).
  - Cubic Capacity Rule:
    - Derivation: $10\text{ linear ft} \times 8.17\text{ ft (98" interior width)} \times 9.0\text{ ft (108" height)} \approx 735\text{ cu ft}$ nominal trailer volume.
    - Tariff Context: NMFC Item 110 Section 8 governs extreme measurements and deemed height ($8\text{ ft}$ deemed height if non-stackable or $> 60\text{ in}$). Carrier tariffs (e.g., Old Dominion, Estes, TForce) establish capacity surcharges when shipments occupy $\ge 750\text{ cu ft}$ and density $< 6\text{ PCF}$. The guide qualifies this rule as tariff-specific rather than a universal statutory threshold.

### 2.6 Carrier-Specific Dimension Rounding, Express Lower-Weight Boundaries & 70 lb Price Cap
- **Service & Shape Matrix Implemented:**
  1. **USPS Commercial Priority Mail Rectangular (DMM 223.1.4.2):** Round each dimension UP to next whole inch; divisor 139; $70\text{ lb}$ price cap.
  2. **USPS Commercial Priority Mail Nonrectangular (DMM 223.1.4.3):** Round off each measurement to NEAREST whole inch; 0.785 shape factor; divisor 166; $70\text{ lb}$ price cap.
  3. **USPS Retail Priority Mail (DMM 123.1.3.2 & 123.1.3.3):** Round each dimension UP to next whole inch for both rectangular and nonrectangular; 0.785 shape factor; divisor 139; $70\text{ lb}$ price cap.
  4. **USPS Priority Mail Express Retail & Commercial (DMM 113.1.3.2/113.1.3.3 & 213.1.4.2/213.1.4.3):** Round each dimension UP to next whole inch; 0.785 shape factor; divisor 139; initial $0.5\text{ lb}$ rating tier for parcels $\le 0.5\text{ lb}$, then whole pounds; $70\text{ lb}$ price cap.
  5. **UPS Daily & Retail Rates (Official UPS Guidelines):** Round each dimension UP to next whole inch.
  6. **FedEx Express & Ground (Official Packaging Guidance):** Round each dimension to NEAREST whole inch.
- **Regression Fixtures Added (12 New Tests, 327 Passing Total):**
  - Explicit 3-value regression test for $30 \times 30 \times 30\text{ in}$ USPS parcel: Unrounded quotient ($194.2446...\text{ lb}$), Calculated dimensional weight ($195.00\text{ lb}$), and Rated price tier ($70.00\text{ lb}$).
  - Actual scale weight above $70\text{ lb}$ across all USPS presets: verified that $75\text{ lb}$ actual weight outputs uncapped $75\text{ lb}$ / $195\text{ lb}$, triggers `isOverweight: true`, produces descriptive service limit text, and renders a prominent ineligibility warning.
  - Non-USPS carrier isolation: verified that UPS Daily and FedEx Domestic do not apply USPS caps to $75\text{ lb}$ packages.

### 2.7 Final USPS Source-Reference Audit (DMM 123, 223, 113, 213)
- **Official DMM Standard Structure:**
  - **Retail Priority Mail ([DMM 123](https://pe.usps.com/text/DMM300/123.htm)):**
    - Section 123.1.3: *Dimensional Weight Price for Low-Density Parcels to Zones 1–9*
    - Section 123.1.3.2: *Determining Dimensional Weight for Rectangular Parcels* (measurements round UP to whole inches; divisor 139).
    - Section 123.1.3.3: *Determining Dimensional Weight for Nonrectangular Parcels* (measurements round UP to whole inches; factor 0.785; divisor 139).
  - **Commercial Priority Mail ([DMM 223](https://pe.usps.com/text/DMM300/223.htm)):**
    - Section 223.1.4: *Dimensional Weight Price for Low-Density Parcels to Zones 1–9*
    - Section 223.1.4.2: *Determining Dimensional Weight for Rectangular Parcels* (measurements round UP to whole inches; divisor 139).
    - Section 223.1.4.3: *Determining Dimensional Weight for Nonrectangular Parcels* (measurements round OFF to nearest whole inch; factor 0.785; divisor 166).
  - **Retail Priority Mail Express ([DMM 113](https://pe.usps.com/text/DMM300/113.htm)):**
    - Section 113.1.3: *Dimensional Weight Price for Low-Density Parcels to Zones 1–9*
    - Section 113.1.3.2: *Determining Dimensional Weight for Rectangular Parcels* (measurements round UP to whole inches; divisor 139).
    - Section 113.1.3.3: *Determining Dimensional Weight for Nonrectangular Parcels* (measurements round UP to whole inches; factor 0.785; divisor 139).
  - **Commercial Priority Mail Express ([DMM 213](https://pe.usps.com/text/DMM300/213.htm)):**
    - Section 213.1.4: *Dimensional Weight Price for Low-Density Parcels to Zones 1–9*
    - Section 213.1.4.2: *Determining Dimensional Weight for Rectangular Parcels* (measurements round UP to whole inches; divisor 139).
    - Section 213.1.4.3: *Determining Dimensional Weight for Nonrectangular Parcels* (measurements round UP to whole inches; factor 0.785; divisor 139).
- **Repository-Wide Remediation of Obsolete References:**
  - Audited and updated all occurrences of obsolete `123.1.4` and `113.1.4` references across the codebase:
    - `src/lib/carrier-rules/index.ts`: Replaced obsolete `DMM 123.1.4.2 & 123.1.4.3` with `DMM 123.1.3.2 & 123.1.3.3` in Retail Priority Mail notes and applicability. Replaced obsolete `DMM 113.1.4 & 213.1.4` with `DMM 113.1.3.2 / 113.1.3.3 & 213.1.4.2 / 213.1.4.3` in Priority Mail Express notes.
    - `src/lib/sources/index.ts`: Updated `usps-dmm-standards` verification method and notes to cite granular subsections `123.1.3.2`, `123.1.3.3`, `223.1.4.2`, `223.1.4.3`, `113.1.3.2`, `113.1.3.3`, `213.1.4.2`, and `213.1.4.3`.
    - `src/lib/guides/registry.ts`: Updated `dimensional-weight-formula` divisor table and DMM step-by-step guidance to cite exact subsections.
    - `src/lib/calculations/calculations.test.ts`: Updated test suite fixture names and comments from `DMM 123.1.4.3` and `DMM 123.1.4.1` to `DMM 123.1.3.3` and `DMM 123.1.3.2 / 223.1.4.2`.
- **Integrity Validation:** Verified calculation logic remains 100% intact and untouched; only citation metadata, registry entries, and explanatory documentation were corrected.

---

## 3. Site Inventory & Route Reconciliation

| Category | Count | Route Paths / Descriptions |
| :--- | :---: | :--- |
| **Interactive Calculators** | **14** | `/freight-class-calculator/`, `/cbm-calculator/`, `/pallet-calculator/`, `/dimensional-weight-calculator/`, `/container-loading-calculator/`, `/freight-density-calculator/`, `/air-freight-chargeable-weight-calculator/`, `/lcl-freight-calculator/`, `/pallets-per-container-calculator/`, `/loading-meter-calculator/`, `/linear-feet-calculator/`, `/package-girth-calculator/`, `/box-size-calculator/`, `/box-volume-calculator/` |
| **Canonical Reference Guides** | **19** | `/guides/20ft-container-dimensions/`, `/guides/40ft-container-dimensions/`, `/guides/40ft-high-cube-container-dimensions/`, `/guides/actual-weight-vs-dimensional-weight/`, `/guides/air-freight-chargeable-weight/`, `/guides/dimensional-weight-formula/`, `/guides/freight-class-chart/`, `/guides/freight-density-explained/`, `/guides/how-to-calculate-cbm/`, `/guides/how-to-calculate-freight-class/`, `/guides/how-to-measure-freight/`, `/guides/lcl-weight-or-measure/`, `/guides/ltl-linear-feet-explained/`, `/guides/nmfc-2025-changes/`, `/guides/right-size-packaging-for-dimensional-weight/`, `/guides/shipping-container-dimensions/`, `/guides/standard-pallet-sizes/`, `/guides/ti-hi-pallet-patterns/`, `/guides/what-is-cbm/` |
| **Guides Index / Hub** | **1** | `/guides/` |
| **Homepage** | **1** | `/` |
| **Static Trust & Legal** | **7** | `/about/`, `/contact/`, `/disclaimer/`, `/methodology/`, `/privacy/`, `/sources/`, `/terms/` |
| **Legacy Redirect Route** | **1** | `/guides/nmfc-density-class-changes/` (HTML meta-refresh & HTTP 301 redirect to `/guides/nmfc-2025-changes/`) |
| **Error Page** | **1** | `/404.html` (Standalone zero-leakage branded error page) |
| **Total HTML Files in `dist/`** | **44** | 43 static routes built by Astro build engine + 1 `404.html`. |
| **XML Sitemap Indexable Routes** | **42** | All 14 calculators + 19 guides + 1 hub + 1 home + 7 static pages (excludes redirect & 404). |

### Explanation of Previous Inventory Counts:
- **18 Guides Initially:** The original set of guides in `registry.ts`.
- **+1 LTL Guide Added:** `/guides/ltl-linear-feet-explained/` created. Total canonical guides = 19.
- **20 Guide URLs Tested in QA:** The QA script evaluated 19 canonical guides PLUS the legacy redirect route `/guides/nmfc-density-class-changes/`, explaining why the count was 20.
- **43 Built Pages:** 1 homepage + 14 calculators + 1 guides index + 19 guides + 7 static trust pages + 1 legacy redirect page $= 43$ pages built by `astro build` (plus `404.html` compiled separately).

---

## 4. Headless Browser Automation & Accessibility Results

### 4.1 Interactive Calculator QA (All 14 Calculators)
Automated testing in Chromium evaluated form reactivity, input perturbation, unit toggling, reset behavior, copy button feedback, negative input validation, and live region announcements:

| Calculator Slug | Reactive Update | Reset Restored | Copy Button | Validation Handled | A11y Live Region |
| :--- | :---: | :---: | :---: | :---: | :---: |
| `freight-class-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `cbm-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `pallet-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `dimensional-weight-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `container-loading-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `freight-density-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `air-freight-chargeable-weight-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `lcl-freight-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `pallets-per-container-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `loading-meter-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `linear-feet-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `package-girth-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `box-size-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |
| `box-volume-calculator` | **Passed** | **Passed** | **Passed** | **Passed** | `aria-live="polite"` |

### 4.2 Axe-Core WCAG 2.1 AA Accessibility Scans
Scans executed using `axe-core` across representative site templates in clean headless contexts:

| Page / Template Audited | Route Path | Violations | Passes | Key A11y Fixes Applied |
| :--- | :--- | :---: | :---: | :--- |
| **Homepage** | `/` | **0** | 19 | Logo accessible name matches visible text; footer text contrast $> 4.5:1$. |
| **CBM Calculator** | `/cbm-calculator/` | **0** | 31 | `sr-only` H2 inside form ensures valid heading hierarchy; `<dl>` content model cleaned up. |
| **Pallet Calculator** | `/pallet-calculator/` | **0** | 32 | Copy button `aria-label="Copy Result to clipboard"` matches visible text label. |
| **Dimensional Weight** | `/dimensional-weight-calculator/` | **0** | 32 | Heading hierarchy H1 $\to$ H2 $\to$ H3 preserved; stat hints moved inside `<dd>`. |
| **Linear Feet Calculator** | `/linear-feet-calculator/` | **0** | 32 | Form inputs labeled and described; live regions active. |
| **Guides Hub** | `/guides/` | **0** | 19 | Semantic cards and category filters. |
| **Guide: NMFC 2025** | `/guides/nmfc-2025-changes/` | **0** | 19 | Data tables contain `<caption>`, `<th scope="col">`, and `<th scope="row">`. |
| **Guide: LTL Linear Feet** | `/guides/ltl-linear-feet-explained/` | **0** | 19 | Fully accessible tables, breadcrumbs, and cross-references. |
| **Methodology** | `/methodology/` | **0** | 19 | Clear section headings and contrast ratios $> 4.5:1$. |
| **Source Registry** | `/sources/` | **0** | 19 | Primary source links with descriptive anchors. |

### 4.3 Responsive Viewport & Dark Mode Audits
- **Pages Tested (13):** Homepage, CBM Calc, Pallet Calc, Container Loading Calc, Freight Class Calc, Dim Weight Calc, Linear Feet Calc, Loading Meter Calc, Guides Hub, NMFC 2025 Guide, LTL Linear Feet Guide, Methodology, Source Registry.
- **Viewports (6):** `320px`, `360px`, `390px`, `768px`, `1024px`, `1440px`.
- **Themes (2):** Light mode and Dark mode.
- **Results:** 156 viewport/theme combinations tested. **0 horizontal scroll overflows** (`scrollWidth <= innerWidth` across all tests).

---

## 5. Preview vs. Production Metadata Verification

Independent builds executed to verify metadata isolation:

### Production Mode (`PUBLIC_SITE_URL=https://freightplanhq.com`)
- **Robots Directive:** `<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1" />`
- **Canonical URLs:** Emitted on all 42 indexable routes (e.g., `<link rel="canonical" href="https://freightplanhq.com/cbm-calculator/" />`).
- **Sitemap:** Generated `sitemap-index.xml` referencing `https://freightplanhq.com/sitemap-0.xml` with absolute production URLs.

### Preview Mode (`PREVIEW_MODE=true` or unconfigured `PUBLIC_SITE_URL`)
- **Robots Directive:** `<meta name="robots" content="noindex, nofollow" />`
- **Canonical URLs:** `<link rel="canonical">` tags suppressed completely to prevent indexing or canonical collision with live environments.

---

## 6. Keyword Strategy & Final Status

- **Status of Quantitative Metrics:** All search volume, keyword difficulty, search trend, and ranking position fields in `docs/seo-keyword-map.csv` remain strictly labeled **`PENDING VALIDATION`**.
- **Honesty Guarantee:** No third-party SEO metrics (Ahrefs, Semrush, Google Keyword Planner) were fabricated. These metrics will only be populated after live data integration and real search console measurement.
- **Content Gap Policy:** No additional speculative pages were created; all 14 calculators and 19 guides map to distinct logistics intents with verified formulas.

---

## 7. Status Classification & Launch Blockers

### 7.1 Completed Work (Ready for Production)
1. Complete mathematical core with 14 calculators and 19 guides.
2. USPS DMM nonrectangular `0.785` factor and exact threshold order of operations.
3. FedEx domestic 139 divisor and nearest whole-inch measurement rounding.
4. Independent regression test suite (**327 tests passing**, covering shape-specific rounding, Express boundaries, 3-value dimensional weight separation, and USPS overweight service limit validation).
5. Clean Astro diagnostics (76 files, 0 errors, 0 warnings, 0 hints).
6. Production static build (43 routes + 404.html).
7. Interactive browser automation across all 14 calculators (100% reactive, reset, copy, and live regions).
8. Zero axe-core WCAG 2.1 AA accessibility violations across site templates.
9. Responsive overflow-free layout across 6 viewports and both themes.
10. Preview `noindex` vs. production canonical isolation.
11. Carrier-specific dimension rounding by service and shape (USPS DMM 223.1.4.3 nonrectangular round-off vs DMM 223.1.4.2 rectangular round-up, Express 0.5 lb initial pricing increment, and USPS 70 lb rate cap).
12. Strict separation of unrounded quotient, calculated dimensional weight, and rated billable tier with explicit USPS service eligibility validation preventing overweight physical parcels (> 70 lb) from silent capping.

### 7.2 Residual Blockers (Awaiting Domain Purchase & Configuration)
The following checks cannot be executed until `freightplanhq.com` is acquired and configured:
1. **Live DNS & Apex/WWW Resolution:** Cannot be tested until DNS records are pointed to Cloudflare Pages.
2. **Production SSL/TLS Handshake:** Live certificate verification requires active domain delegation.
3. **External Cloudflare Edge Redirects:** Edge-level 301 redirection from `www.freightplanhq.com` to `https://freightplanhq.com/`.
4. **MX Records & Inbound Contact Mail:** Deliverability of `contact@freightplanhq.com` requires email service provisioning.
5. **Search Console Submission:** Verification of ownership in Google Search Console and Bing Webmaster Tools.
