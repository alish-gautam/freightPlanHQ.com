export interface GuideSection {
  title: string;
  content: string;
  table?: {
    caption: string;
    head: string[];
    rows: string[][];
  };
}

export interface GuideMeta {
  slug: string;
  path: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  category: 'Freight Measurement' | 'Pallet Planning' | 'Packaging' | 'Air & Ocean' | 'Containers & Trailers';
  summary: string;
  readingTime: string;
  lastVerified: string;
  sections: GuideSection[];
  relatedCalculators: string[];
  relatedGuides: string[];
  sourceIds: string[];
}

export const guides: GuideMeta[] = [
  {
    slug: 'freight-class-chart',
    path: '/guides/freight-class-chart/',
    title: 'Freight Class Chart (13-Sub Density Table)',
    h1: 'LTL Freight Class Chart: 13-Sub Density Table',
    metaTitle: 'Freight Class Chart — 13-Sub Density Table — FreightPlanHQ',
    metaDescription:
      'Standard 13-sub density-based freight class chart for North American LTL shipping. Exact density breaks (PCF) and freight class ratings from 50 to 400.',
    category: 'Freight Measurement',
    summary:
      'A reference chart mapping shipment density in pounds per cubic foot (PCF) to the current 13-sub density freight class structure used in North American LTL shipping.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The 13-Sub Density Structure',
        content:
          'In North American Less-Than-Truckload (LTL) shipping, freight class ratings determine base transportation rates. Historically derived from commodity lookups, modern classification increasingly relies on density (pounds per cubic foot, or PCF). Below is the standard 13-sub full-scale density structure published by the NMFTA for density-based freight.',
        table: {
          caption: 'NMFTA 13-Sub Density-to-Class Scale',
          head: ['Density Band (lb/ft³)', 'Freight Class', 'Typical Commodity Profile'],
          rows: [
            ['Less than 1', 'Class 400', 'Extremely low density (ping pong balls, light foam, hollow plastics)'],
            ['1 to <2', 'Class 300', 'Very bulky cargo (lampshades, empty boxes, unwrapped insulation)'],
            ['2 to <4', 'Class 250', 'Bulky consumer goods (mattresses, hollow furniture)'],
            ['4 to <6', 'Class 175', 'Low-density boxed goods (light clothing, assembled cabinetry)'],
            ['6 to <8', 'Class 125', 'Medium-low density (small appliances, cookware, sporting goods)'],
            ['8 to <10', 'Class 100', 'Standard general merchandise (packaged consumer electronics)'],
            ['10 to <12', 'Class 92.5', 'Dense packaged goods (books, paper goods, bottled beverages)'],
            ['12 to <15', 'Class 85', 'Packaged non-perishables (canned foods, bulk dry goods)'],
            ['15 to <22.5', 'Class 70', 'Dense hardware (auto parts, hand tools, plumbing fixtures)'],
            ['22.5 to <30', 'Class 65', 'Heavy components (dense machinery parts, fasteners)'],
            ['30 to <35', 'Class 60', 'Industrial materials (steel bars, heavy hardware)'],
            ['35 to <50', 'Class 55', 'Very dense commodities (bricks, mortar, bulk hardware)'],
            ['50 or more', 'Class 50', 'Extremely dense cargo (solid steel ingots, lead, cast iron)'],
          ],
        },
      },
      {
        title: 'Boundary Handling & Exact Break Rules',
        content:
          'Each density band is defined with a closed lower bound and an open upper bound. For example, a shipment with a calculated density of exactly 10.00 lb/ft³ is classified as Class 92.5 (10 to <12 PCF), not Class 100. Similarly, 15.00 lb/ft³ lands in Class 70. Precision in calculation is critical: a fraction of an inch or pound can push a shipment across a class boundary, causing significant rate changes on your freight bill.',
      },
      {
        title: 'Planning Caveat: Density vs Commodity Provisions',
        content:
          'While density is the primary quantifiable metric, official National Motor Freight Classification (NMFC) tariffs also consider handling, stowability, and liability (susceptibility to theft or damage). Items with specific NMFC item numbers may have fixed classes regardless of density. Always confirm with your carrier or third-party logistics partner.',
      },
    ],
    relatedCalculators: ['freight-class-calculator', 'freight-density-calculator'],
    relatedGuides: ['how-to-calculate-freight-class', 'nmfc-density-class-changes', 'freight-density-explained'],
    sourceIds: ['nmfta-density-structure'],
  },
  {
    slug: 'how-to-calculate-freight-class',
    path: '/guides/how-to-calculate-freight-class/',
    title: 'How to Calculate Freight Class',
    h1: 'How to Calculate LTL Freight Class: Step-by-Step Guide',
    metaTitle: 'How to Calculate Freight Class — Step-by-Step PCF Formula — FreightPlanHQ',
    metaDescription:
      'Learn how to calculate shipment density and freight class step-by-step. Includes cubic feet formulas, pallet measuring tips, and worked examples.',
    category: 'Freight Measurement',
    summary:
      'A practical step-by-step walkthrough showing how to measure freight, calculate cubic feet, determine density (PCF), and look up the estimated freight class.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Freight Class Formula',
        content:
          'Freight class for density-based LTL cargo is calculated in four steps:\n\n1. Measure the length, width, and height of each handling unit in inches (including pallet and protrusions).\n2. Calculate the total cubic feet: (Length × Width × Height) ÷ 1,728.\n3. Weigh the total shipment on a certified scale (including pallet tare weight).\n4. Calculate density (PCF): Total Weight in Pounds ÷ Total Volume in Cubic Feet.',
      },
      {
        title: 'Worked Example: Single Loaded Pallet',
        content:
          'Consider a pallet shipment with the following verified measurements:\n\n* Dimensions: 48 in (L) × 40 in (W) × 54 in (H)\n* Total Gross Weight: 850 lb\n\nStep 1: Calculate cubic volume in inches:\n48 × 40 × 54 = 103,680 cubic inches.\n\nStep 2: Convert to cubic feet:\n103,680 ÷ 1,728 = 60.0 cubic feet.\n\nStep 3: Calculate density:\n850 lb ÷ 60.0 ft³ = 14.17 lb/ft³ (PCF).\n\nStep 4: Look up in the 13-sub density table:\n14.17 lb/ft³ falls in the 12 to <15 PCF band, resulting in an estimated Freight Class 85.',
      },
      {
        title: 'Common Mistakes That Cause Carrier Re-Weigh Adjustments',
        content:
          'Carriers routinely run shipments through automated dimensioning scanners. The three most common triggers for re-billing are:\n\n* Forgetting pallet height: Measuring carton height instead of total loaded height from floor to top.\n* Ignoring overhang: If boxes bulge 2 inches beyond the pallet deck, the scanner measures the widest bulge.\n* Underestimating tare weight: Forgetting that a standard wooden GMA pallet weighs 35–45 lb.',
      },
    ],
    relatedCalculators: ['freight-class-calculator', 'freight-density-calculator', 'cbm-calculator'],
    relatedGuides: ['freight-class-chart', 'how-to-measure-freight', 'freight-density-explained'],
    sourceIds: ['nmfta-density-structure'],
  },
  {
    slug: 'nmfc-density-class-changes',
    path: '/guides/nmfc-density-class-changes/',
    title: 'NMFC Density Class Changes',
    h1: 'NMFC Density Class Changes: Transition and Current Standard',
    metaTitle: 'NMFC Density Class Changes — Historical 2025 Transition & Current Rules',
    metaDescription:
      'Understanding the NMFTA transition toward standardized density-based classification. Historical context from the 2025 reforms and the current classification landscape.',
    category: 'Freight Measurement',
    summary:
      'An overview of the ongoing NMFTA modernization shifting commodity-specific classification toward standardized density tiers, including historical context and current application.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Shift to Density-Based Classification',
        content:
          'Historically, the National Motor Freight Classification (NMFC) maintained thousands of commodity-specific item codes with distinct rules based on material composition and trade jargon. In 2025, the National Motor Freight Traffic Association (NMFTA) advanced major docket reforms (notably effective July 19, 2025) transitioning large numbers of legacy commodity items into standardized 13-sub density schedules.',
      },
      {
        title: 'Why Carriers and Shippers Moved to Density',
        content:
          'Automated forklift dimensioners and drive-through laser scanners now measure LTL freight in seconds on carrier cross-dock platforms. Density-based classification aligns rating with the physical physics of transportation: LTL trailers cube out (fill their volume) before they gross out (reach highway weight limits). Standardizing classes around density reduces billing disputes and carrier re-class fees.',
      },
      {
        title: 'Current Classification Landscape in 2026',
        content:
          'Today, density is the default planning benchmark for general freight. However, shippers must note that NMFTA continues to evaluate commodity groups incrementally. Non-density factors like chemical hazardous status, fragile handling requirements, and high liability (theft exposure) still maintain dedicated classification rules.',
      },
    ],
    relatedCalculators: ['freight-class-calculator', 'freight-density-calculator'],
    relatedGuides: ['freight-class-chart', 'how-to-calculate-freight-class'],
    sourceIds: ['nmfta-density-structure'],
  },
  {
    slug: 'freight-density-explained',
    path: '/guides/freight-density-explained/',
    title: 'Freight Density Explained',
    h1: 'Freight Density Explained: PCF, Volume, and Packaging Impact',
    metaTitle: 'Freight Density Explained — PCF Formula & Packaging Optimization',
    metaDescription:
      'Understand freight density in logistics. Learn how pounds per cubic foot (PCF) is calculated, how to convert to kg/m³, and how packaging choices impact freight costs.',
    category: 'Freight Measurement',
    summary:
      'A deep dive into freight density, why carriers prioritize volume efficiency, and how optimizing carton packaging directly lowers transportation costs.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'What Is Freight Density?',
        content:
          'Freight density measures how compact a shipment is, expressed as mass per unit volume. In North America, the standard unit is pounds per cubic foot (lb/ft³ or PCF). In international metric logistics, density is expressed in kilograms per cubic meter (kg/m³).',
      },
      {
        title: 'Unit Conversion: PCF to kg/m³',
        content:
          'To convert between imperial and metric density:\n\n* 1 lb/ft³ = 16.0185 kg/m³\n* 1 kg/m³ = 0.0624 lb/ft³\n\nFor example, a density of 10 PCF corresponds to approximately 160.2 kg/m³.',
      },
      {
        title: 'Why Higher Density Means Lower Freight Rates',
        content:
          'In freight rating, higher density generally earns a lower numerical class (e.g., Class 50 vs Class 400). Lower freight classes have significantly lower base shipping rates per hundredweight (cwt). Shippers who eliminate excess void space and increase packaging density save substantial freight costs.',
      },
    ],
    relatedCalculators: ['freight-density-calculator', 'freight-class-calculator', 'box-size-calculator'],
    relatedGuides: ['freight-class-chart', 'how-to-calculate-cbm', 'right-size-packaging-for-dimensional-weight'],
    sourceIds: ['nmfta-density-structure'],
  },
  {
    slug: 'what-is-cbm',
    path: '/guides/what-is-cbm/',
    title: 'What Is CBM in Shipping?',
    h1: 'What Is CBM in Shipping: Definition, Uses, and Conversions',
    metaTitle: 'What Is CBM in Shipping? — Cubic Meter Definition & Conversions',
    metaDescription:
      'Discover what CBM (Cubic Meter) means in international freight shipping. Learn how CBM dictates ocean container capacity, LCL billing, and air cargo charges.',
    category: 'Freight Measurement',
    summary:
      'An introductory guide explaining the concept of Cubic Meters (CBM), why it is the primary volume metric in global logistics, and how to convert from other units.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'Definition of CBM',
        content:
          'CBM stands for Cubic Meter (m³). It is the metric measurement of volume equal to a cube with dimensions of 1 meter long, 1 meter wide, and 1 meter high (1 m × 1 m × 1 m). CBM is the universal measurement standard across international ocean shipping, air freight, and global forwarding.',
      },
      {
        title: 'Essential CBM Conversions',
        content:
          '* 1 CBM = 35.3147 cubic feet (ft³)\n* 1 CBM = 61,023.7 cubic inches (in³)\n* 1 CBM = 1,000 liters\n* 1 CBM = 1,000,000 cubic centimeters (cm³)',
      },
      {
        title: 'How CBM Is Used Across Freight Modes',
        content:
          '* Ocean FCL: Used to determine whether goods will fit inside 20ft (~33 CBM nominal), 40ft (~67 CBM), or 40ft High Cube (~76 CBM) containers.\n* Ocean LCL: Serves as the primary billing basis under the Weight or Measure (W/M) tariff, where 1 CBM equals 1 metric tonne.\n* Air Freight: Converted to volumetric weight at the standard IATA ratio of 1 CBM = 166.67 kg (6,000 cm³/kg).',
      },
    ],
    relatedCalculators: ['cbm-calculator', 'box-volume-calculator', 'lcl-freight-calculator'],
    relatedGuides: ['how-to-calculate-cbm', 'lcl-weight-or-measure', 'air-freight-chargeable-weight'],
    sourceIds: ['lcl-wm', 'container-line-specs'],
  },
  {
    slug: 'how-to-calculate-cbm',
    path: '/guides/how-to-calculate-cbm/',
    title: 'How to Calculate CBM',
    h1: 'How to Calculate CBM for Shipping: Formulas & Worked Examples',
    metaTitle: 'How to Calculate CBM — Formulas for cm, mm, and inches — FreightPlanHQ',
    metaDescription:
      'Step-by-step formulas to calculate CBM (cubic meters) from centimeters, millimeters, and inches for multi-carton and palletized consignments.',
    category: 'Freight Measurement',
    summary:
      'A practical guide showing exact formulas to calculate CBM from various measurement units, including multi-carton and multi-pallet export calculations.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'CBM Formulas by Input Unit',
        content:
          '* From meters: CBM = Length (m) × Width (m) × Height (m) × Quantity\n* From centimeters: CBM = (Length × Width × Height in cm ÷ 1,000,000) × Quantity\n* From millimeters: CBM = (Length × Width × Height in mm ÷ 1,000,000,000) × Quantity\n* From inches: CBM = (Length × Width × Height in inches ÷ 61,023.7) × Quantity',
      },
      {
        title: 'Worked Example: Multi-Carton Consignment',
        content:
          'Suppose you have 80 cartons of goods, each measuring 50 cm long, 40 cm wide, and 30 cm high.\n\n1. Calculate volume of one carton in cm³: 50 × 40 × 30 = 60,000 cm³.\n2. Convert one carton to CBM: 60,000 ÷ 1,000,000 = 0.06 CBM.\n3. Multiply by total cartons: 0.06 CBM × 80 = 4.80 CBM total.',
      },
      {
        title: 'Measuring Palletized Cargo vs Loose Cartons',
        content:
          'If cargo is shipped palletized, forwarders bill on the total external dimensions of the packed pallet (including pallet footprint and deck height), not the individual loose cartons. A pallet measuring 1.2 m × 1.0 m × 1.6 m equals 1.92 CBM regardless of how tightly packed the cartons are inside.',
      },
    ],
    relatedCalculators: ['cbm-calculator', 'box-volume-calculator', 'pallet-calculator'],
    relatedGuides: ['what-is-cbm', 'how-to-measure-freight', 'lcl-weight-or-measure'],
    sourceIds: ['lcl-wm'],
  },
  {
    slug: 'dimensional-weight-formula',
    path: '/guides/dimensional-weight-formula/',
    title: 'Dimensional Weight Formula',
    h1: 'Dimensional Weight Formula: Divisors, Calculations, and Rules',
    metaTitle: 'Dimensional Weight Formula — Divisors (139, 166, 5000) Explained',
    metaDescription:
      'Learn how the dimensional (volumetric) weight formula works across parcel and express shipping. Understand standard divisors 139, 166, and 5000.',
    category: 'Packaging',
    summary:
      'A technical explanation of the dimensional weight formula, the physical mechanics of carrier divisors, and how to verify which divisor applies to your service.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Core Dimensional Weight Equation',
        content:
          'Dimensional weight reflects the density floor expected by carriers. The formula is:\n\nDIM Weight = (Length × Width × Height) ÷ Divisor\n\nWhere the dimensions are multiplied in inches or centimeters, and divided by a carrier-specified volumetric factor (divisor).',
      },
      {
        title: 'Standard Carrier Divisors',
        content:
          'Divisors vary by carrier mode, region, and contractual status:',
        table: {
          caption: 'Common Industry Dimensional Divisors',
          head: ['Divisor', 'Unit Basis', 'Application Profile'],
          rows: [
            ['139 in³/lb', 'Inches & Pounds', 'Standard US commercial parcel rates (UPS, FedEx)'],
            ['166 in³/lb', 'Inches & Pounds', 'US retail counter rates, USPS Priority Mail, legacy contracts'],
            ['5,000 cm³/kg', 'Centimeters & Kilograms', 'Standard international express / metric couriers (DHL, FedEx, UPS)'],
            ['6,000 cm³/kg', 'Centimeters & Kilograms', 'Traditional IATA general air cargo planning convention'],
          ],
        },
      },
      {
        title: 'How Divisors Relate to Density',
        content:
          'The divisor is inversely proportional to density. A 139 divisor represents approximately 12.4 lb/ft³ (1,728 ÷ 139 = 12.43). A 166 divisor represents approximately 10.4 lb/ft³. A smaller divisor results in a higher dimensional weight, meaning carriers charge more for lightweight packages.',
      },
    ],
    relatedCalculators: ['dimensional-weight-calculator', 'air-freight-chargeable-weight-calculator', 'package-girth-calculator'],
    relatedGuides: ['actual-weight-vs-dimensional-weight', 'right-size-packaging-for-dimensional-weight'],
    sourceIds: ['parcel-dim-us', 'fedex-ups-rounding'],
  },
  {
    slug: 'actual-weight-vs-dimensional-weight',
    path: '/guides/actual-weight-vs-dimensional-weight/',
    title: 'Actual Weight vs Dimensional Weight',
    h1: 'Actual Weight vs Dimensional Weight: Billable Weight Explained',
    metaTitle: 'Actual Weight vs Dimensional Weight — How Billable Weight Works',
    metaDescription:
      'Understand the difference between actual scale weight and dimensional weight in freight billing. Learn how billable weight is determined with clear examples.',
    category: 'Packaging',
    summary:
      'An explanation of how carriers compare gross scale weight against volumetric weight to determine billable weight, with practical rules to prevent overpaying.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Billable Weight Rule',
        content:
          'Carrier billing follows a simple rule across parcel and air freight:\n\nBillable Weight = max(Actual Weight, Dimensional Weight)\n\nWhichever figure is greater becomes the basis for freight charges. If actual weight is higher, the shipment is "dense" and billed on scale weight. If dimensional weight is higher, the shipment is "lightweight/bulky" and billed on dimensional weight.',
      },
      {
        title: 'Worked Comparison Examples',
        content:
          'Case 1: Dense Freight (Actual Wins)\n* Box: 12 × 12 × 12 in (1,728 in³), actual weight 25 lb.\n* DIM weight (139 divisor): 1,728 ÷ 139 = 12.43 lb.\n* Result: Billed on Actual Weight (25.0 lb).\n\nCase 2: Bulky Freight (DIM Wins)\n* Box: 24 × 20 × 16 in (7,680 in³), actual weight 15 lb.\n* DIM weight (139 divisor): 7,680 ÷ 139 = 55.25 lb.\n* Result: Billed on Dimensional Weight (55.25 lb). The shipper pays for 40.25 lb of "phantom" air space!',
      },
      {
        title: 'Actionable Steps to Control Billable Weight',
        content:
          '* Audit carton inventory: Stock box sizes matched to popular product bundles.\n* Avoid over-packaging: Cushion with lightweight air pillows rather than heavy dunnage, but minimize carton exterior size.\n* Negotiate custom contract divisors: Shippers with large volume can negotiate 166 or custom divisors with parcel carriers.',
      },
    ],
    relatedCalculators: ['dimensional-weight-calculator', 'box-size-calculator'],
    relatedGuides: ['dimensional-weight-formula', 'right-size-packaging-for-dimensional-weight'],
    sourceIds: ['parcel-dim-us'],
  },
  {
    slug: 'air-freight-chargeable-weight',
    path: '/guides/air-freight-chargeable-weight/',
    title: 'Air Freight Chargeable Weight',
    h1: 'Air Freight Chargeable Weight: IATA Rules and Calculations',
    metaTitle: 'Air Freight Chargeable Weight — IATA 1:6000 Volumetric Rules',
    metaDescription:
      'Learn how airlines calculate chargeable weight for air cargo. Understand the IATA 1:6000 volumetric ratio, cm³ conversions, and rounding policies.',
    category: 'Air & Ocean',
    summary:
      'A comprehensive guide to air cargo chargeable weight calculations under standard IATA conventions, comparing airline freight against courier express services.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The IATA 1:6000 Volumetric Standard',
        content:
          'The International Air Transport Association (IATA) establishes standard conventions for commercial air freight. Under standard airline tariffs, 1 cubic meter of cargo space is deemed equivalent to 166.67 kilograms of volumetric weight. This derives from the 6,000 cm³/kg divisor (1,000,000 cm³ ÷ 6,000 = 166.67 kg).',
      },
      {
        title: 'Per-Shipment vs Per-Piece Calculation',
        content:
          'A vital distinction exists between general airline cargo and express couriers:\n\n* General Air Cargo (IATA): Typically aggregates total shipment volume and total gross weight before comparing: Chargeable Weight = max(Total Gross Weight, Total Volume ÷ 6000).\n* Express / Courier Air: Often evaluates chargeable weight on each piece individually, then sums the chargeable weights. Individual piece evaluation frequently produces higher billable totals.',
      },
      {
        title: 'Airline Weight Rounding Rules',
        content:
          'Standard international airline practice rounds chargeable weight up to the nearest whole kilogram or half-kilogram (0.5 kg). For example, 142.1 kg is rounded to 142.5 kg or 143.0 kg depending on carrier tariff.',
      },
    ],
    relatedCalculators: ['air-freight-chargeable-weight-calculator', 'cbm-calculator'],
    relatedGuides: ['dimensional-weight-formula', 'what-is-cbm'],
    sourceIds: ['iata-volumetric'],
  },
  {
    slug: 'lcl-weight-or-measure',
    path: '/guides/lcl-weight-or-measure/',
    title: 'LCL Weight or Measure (W/M)',
    h1: 'LCL Weight or Measure (W/M): Ocean Freight Revenue Tons',
    metaTitle: 'LCL Weight or Measure (W/M) — Revenue Tons Explained — FreightPlanHQ',
    metaDescription:
      'Understand the ocean LCL Weight or Measure (W/M) pricing rule. Learn how forwarders calculate Revenue Tons (RT) comparing CBM vs metric tonnes.',
    category: 'Air & Ocean',
    summary:
      'A guide to ocean Less-than-Container-Load (LCL) pricing, explaining the Weight or Measure (W/M) principle, revenue tons, and local port charges.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Weight or Measure (W/M) Principle',
        content:
          'Ocean consolidation carriers charge LCL freight based on "Weight or Measure" (W/M). The standard maritime conversion is:\n\n1 Cubic Meter (CBM) = 1 Metric Tonne (1,000 kg)\n\nThe carrier evaluates both figures and charges the larger one. The billable unit is known as a Revenue Ton (RT) or Freight Ton (FT).',
      },
      {
        title: 'Worked Example of LCL Rating',
        content:
          'Suppose an exporter books a shipment measuring 4.2 CBM and weighing 1,500 kg:\n\n* Measure (Volume): 4.2 CBM = 4.2 RT\n* Weight: 1,500 kg ÷ 1,000 = 1.5 MT = 1.5 RT\n* Chargeable basis: max(4.2, 1.5) = 4.2 Revenue Tons (Volume wins).\n\nIf the freight rate is $75 per W/M, base ocean freight is 4.2 × $75 = $315.00.',
      },
      {
        title: 'Beware Hidden Destination and Port Handling Charges',
        content:
          'Base ocean freight on LCL is often very low (or even zero in aggressive forwarder marketing). However, consolidators apply Container Freight Station (CFS), Terminal Handling Charges (THC), documentation, and de-consolidation fees at the destination port per Revenue Ton. Always request a full door-to-door quotation.',
      },
    ],
    relatedCalculators: ['lcl-freight-calculator', 'cbm-calculator', 'container-loading-calculator'],
    relatedGuides: ['what-is-cbm', 'shipping-container-dimensions'],
    sourceIds: ['lcl-wm'],
  },
  {
    slug: 'standard-pallet-sizes',
    path: '/guides/standard-pallet-sizes/',
    title: 'Standard Pallet Sizes',
    h1: 'Standard Pallet Sizes: ISO 6780, Euro, and GMA Dimensions',
    metaTitle: 'Standard Pallet Sizes — Dimensions, Regions & ISO 6780 Specs',
    metaDescription:
      'Complete guide to standard pallet dimensions worldwide. Includes North American GMA (48x40"), European EPAL (1200x800mm), and ISO 6780 footprints.',
    category: 'Pallet Planning',
    summary:
      'A reference directory of the world’s major standardized pallet footprints, their regional adoption, ISO specifications, and handling characteristics.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'Major International Pallet Footprints',
        content:
          'Pallet standardization allows automated conveying, container loading, and warehouse racking. Below are the primary recognized footprints:',
        table: {
          caption: 'Standard Pallet Dimensions (ISO 6780 & Regional Standards)',
          head: ['Pallet Designation', 'Metric (mm)', 'Imperial (in)', 'Primary Region / Industry'],
          rows: [
            ['EUR / EPAL (Euro Pallet)', '1200 × 800 mm', '47.2 × 31.5 in', 'Europe, international road and rail'],
            ['Industrial / EUR 2', '1200 × 1000 mm', '47.2 × 39.4 in', 'Europe, Asia, industrial manufacturing'],
            ['North American GMA Standard', '1219 × 1016 mm', '48.0 × 40.0 in', 'USA, Canada, grocery and consumer goods'],
            ['Square 42 × 42', '1067 × 1067 mm', '42.0 × 42.0 in', 'North America (paint, telecommunications, drums)'],
            ['Square 1100 × 1100', '1100 × 1100 mm', '43.3 × 43.3 in', 'Asia (Japan, South Korea, China)'],
            ['Australian Standard', '1165 × 1165 mm', '45.9 × 45.9 in', 'Australia (rail and road distribution)'],
          ],
        },
      },
      {
        title: 'Tare Weights and Deck Heights',
        content:
          'Standard wooden GMA pallets typically weigh 35–45 lb (16–20 kg) with a deck height of 4.75–5.0 inches (120–130 mm). Certified EPAL wooden Euro pallets weigh approximately 25 kg (55 lb) with a deck height of 144 mm (5.7 in). Always account for deck height when planning maximum vertical clearance.',
      },
    ],
    relatedCalculators: ['pallet-calculator', 'pallets-per-container-calculator', 'loading-meter-calculator'],
    relatedGuides: ['ti-hi-pallet-patterns', 'shipping-container-dimensions'],
    sourceIds: ['iso-6780', 'epal-euro-pallet'],
  },
  {
    slug: 'ti-hi-pallet-patterns',
    path: '/guides/ti-hi-pallet-patterns/',
    title: 'TI × HI Pallet Patterns',
    h1: 'TI × HI Pallet Patterns: Stacking Configurations & Stability',
    metaTitle: 'TI × HI Pallet Patterns — Stacking Configurations & Layer Stability',
    metaDescription:
      'Learn what TI and HI mean in warehousing. Discover column stacking vs interlocking patterns, overhang hazards, and how to maximize pallet stability.',
    category: 'Pallet Planning',
    summary:
      'A practical guide to pallet stacking geometry, explaining how tier count (TI) and height (HI) determine pallet load stability, warehouse density, and transit durability.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'Understanding TI and HI',
        content:
          'In warehouse operations, pallet stacking is defined by two numbers:\n\n* TI (Tier): The number of cartons placed on a single layer of the pallet deck.\n* HI (High): The number of layers stacked vertically.\n\nTotal Cartons = TI × HI. For example, a pallet with 8 cartons per layer stacked 5 layers high has a TI of 8 and HI of 5, holding 40 cartons.',
      },
      {
        title: 'Column Stacking vs Interlocking Stacking',
        content:
          '* Column Stacking (Aligned): Cartons sit directly aligned corner-to-corner over the layer below. This preserves 100% of the corrugated carton’s compressive strength, but layers can slide independently without stretch wrap.\n* Interlocking Stacking: Cartons are pinwheeled or rotated on alternating layers like brickwork. This provides superior pallet stability, but can reduce carton compression strength by 20–40% because corners do not align over corners.',
      },
      {
        title: 'The Danger of Pallet Overhang',
        content:
          'Allowing cartons to hang over the pallet edge by even 1 inch (25 mm) reduces corrugated stacking strength by up to 32%. Overhang also exposes packaging to punctures from adjacent pallets and warehouse racking.',
      },
    ],
    relatedCalculators: ['pallet-calculator', 'box-size-calculator'],
    relatedGuides: ['standard-pallet-sizes', 'how-to-measure-freight'],
    sourceIds: ['iso-6780'],
  },
  {
    slug: 'shipping-container-dimensions',
    path: '/guides/shipping-container-dimensions/',
    title: 'Shipping Container Dimensions',
    h1: 'Shipping Container Dimensions: 20ft, 40ft, and 40ft High Cube',
    metaTitle: 'Shipping Container Dimensions — 20ft, 40ft & High Cube Specs',
    metaDescription:
      'Complete reference specifications for standard shipping containers. Internal dimensions, door openings, tare weights, and maximum payloads.',
    category: 'Containers & Trailers',
    summary:
      'A reference comparison of standard dry shipping containers (20ft, 40ft, 40ft HC), including internal dimensions, cubic capacities, door clear openings, and payloads.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'Standard Dry Container Specifications',
        content:
          'Ocean shipping lines build containers to ISO standard external dimensions, but internal dimensions and payloads vary slightly by manufacturer and series. Below are representative planning specifications:',
        table: {
          caption: 'Dry Ocean Container Reference Specifications',
          head: ['Specification', '20 ft Standard', '40 ft Standard', '40 ft High Cube'],
          rows: [
            ['Internal Length', '5,896 mm (19.34 ft)', '12,032 mm (39.47 ft)', '12,032 mm (39.47 ft)'],
            ['Internal Width', '2,350 mm (7.71 ft)', '2,350 mm (7.71 ft)', '2,350 mm (7.71 ft)'],
            ['Internal Height', '2,393 mm (7.85 ft)', '2,393 mm (7.85 ft)', '2,697 mm (8.85 ft)'],
            ['Door Width', '2,340 mm (7.68 ft)', '2,340 mm (7.68 ft)', '2,340 mm (7.68 ft)'],
            ['Door Height', '2,274 mm (7.46 ft)', '2,274 mm (7.46 ft)', '2,577 mm (8.45 ft)'],
            ['Nominal Volume', '33.2 CBM (1,172 ft³)', '67.7 CBM (2,390 ft³)', '76.3 CBM (2,694 ft³)'],
            ['Approx. Max Payload', '28,200 kg (62,170 lb)', '28,800 kg (63,490 lb)', '28,620 kg (63,090 lb)'],
          ],
        },
      },
      {
        title: 'Door Opening vs Internal Dimensions',
        content:
          'Notice that container door openings are narrower and shorter than the interior walls. For example, a 20ft container has an internal height of 2,393 mm, but the door opening height is only 2,274 mm. Cargo that matches the internal ceiling height cannot pass through the doors without tipping.',
      },
    ],
    relatedCalculators: ['container-loading-calculator', 'pallets-per-container-calculator', 'cbm-calculator'],
    relatedGuides: ['20ft-container-dimensions', '40ft-container-dimensions', '40ft-high-cube-container-dimensions'],
    sourceIds: ['container-line-specs'],
  },
  {
    slug: '20ft-container-dimensions',
    path: '/guides/20ft-container-dimensions/',
    title: '20ft Container Dimensions',
    h1: '20ft Shipping Container Dimensions & Loading Capacity',
    metaTitle: '20ft Container Dimensions — Internal Size, CBM & Payload Specs',
    metaDescription:
      'Detailed specifications for 20ft standard dry shipping containers. Internal length, width, height, door clearances, practical CBM capacity, and payload limits.',
    category: 'Containers & Trailers',
    summary:
      'A deep dive into 20-foot standard dry container specifications, practical packing limits, pallet capacities, and highway weight restrictions.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: '20ft Container Interior Dimensions',
        content:
          '* Internal Length: 5,896 mm (19 ft 4 in)\n* Internal Width: 2,350 mm (7 ft 8.5 in)\n* Internal Height: 2,393 mm (7 ft 10 in)\n* Door Opening: 2,340 mm (W) × 2,274 mm (H)\n* Nominal Volume: 33.2 CBM (1,172 cu ft)\n* Approximate Maximum Payload: 28,200 kg (62,170 lb)',
      },
      {
        title: 'Practical Usable CBM Capacity',
        content:
          'While theoretical interior volume is 33.2 CBM, practical carton packing achieves approximately 25 to 28 CBM due to ceiling clearance and carton shape irregularities. When shipping palletized cargo, a 20ft container accommodates 10 GMA pallets (48×40 in) or 11 Euro pallets (1200×800 mm).',
      },
      {
        title: 'Heavy Cargo Considerations',
        content:
          '20ft containers are the equipment of choice for heavy, dense commodities (metals, machinery, grains, liquids in flexitanks) because they maximize permissible weight without wasting empty volume.',
      },
    ],
    relatedCalculators: ['container-loading-calculator', 'pallets-per-container-calculator'],
    relatedGuides: ['shipping-container-dimensions', '40ft-container-dimensions'],
    sourceIds: ['container-line-specs'],
  },
  {
    slug: '40ft-container-dimensions',
    path: '/guides/40ft-container-dimensions/',
    title: '40ft Container Dimensions',
    h1: '40ft Shipping Container Dimensions & Loading Capacity',
    metaTitle: '40ft Container Dimensions — Internal Size, CBM & Stacking Specs',
    metaDescription:
      'Detailed specifications for 40ft standard dry shipping containers. Internal dimensions, volume, door openings, practical packing guidelines, and payload limits.',
    category: 'Containers & Trailers',
    summary:
      'A complete guide to 40-foot standard dry ocean containers, detailing interior measurements, volumetric capacity, pallet counts, and loading strategies.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: '40ft Container Interior Dimensions',
        content:
          '* Internal Length: 12,032 mm (39 ft 5.7 in)\n* Internal Width: 2,350 mm (7 ft 8.5 in)\n* Internal Height: 2,393 mm (7 ft 10 in)\n* Door Opening: 2,340 mm (W) × 2,274 mm (H)\n* Nominal Volume: 67.7 CBM (2,390 cu ft)\n* Approximate Maximum Payload: 28,800 kg (63,490 lb)',
      },
      {
        title: 'Practical Volume & Pallet Capacity',
        content:
          'A 40ft container realistically accommodates 55 to 60 CBM of packed cartons. For palletized shipments, a 40ft container holds 20–21 standard North American GMA pallets (48×40 in) or 24–25 Euro pallets (1200×800 mm) on a single floor layer.',
      },
    ],
    relatedCalculators: ['container-loading-calculator', 'pallets-per-container-calculator'],
    relatedGuides: ['shipping-container-dimensions', '40ft-high-cube-container-dimensions'],
    sourceIds: ['container-line-specs'],
  },
  {
    slug: '40ft-high-cube-container-dimensions',
    path: '/guides/40ft-high-cube-container-dimensions/',
    title: '40ft High Cube Container Dimensions',
    h1: '40ft High Cube Container Dimensions: Extra Height Advantage',
    metaTitle: '40ft High Cube Container Dimensions — Height, Volume & Loading',
    metaDescription:
      'Specifications for 40ft High Cube (40HC) shipping containers. Discover why the extra 1 foot of height provides ~76 CBM of volume for lightweight cargo.',
    category: 'Containers & Trailers',
    summary:
      'An overview of 40-foot High Cube containers, explaining the 30 cm vertical height extension, cubic capacity gains, and ideal cargo applications.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: '40ft High Cube Interior Dimensions',
        content:
          '* Internal Length: 12,032 mm (39 ft 5.7 in)\n* Internal Width: 2,350 mm (7 ft 8.5 in)\n* Internal Height: 2,697 mm (8 ft 10.2 in)\n* Door Opening: 2,340 mm (W) × 2,577 mm (H)\n* Nominal Volume: 76.3 CBM (2,694 cu ft)\n* Approximate Maximum Payload: 28,620 kg (63,090 lb)',
      },
      {
        title: 'The High Cube Advantage',
        content:
          'A 40ft High Cube is approximately 304 mm (1 foot) taller than a standard 40ft container. This provides an additional 8.6 CBM (~300 ft³) of usable volume, making it the premier choice for consumer electronics, furniture, apparel, and lightweight e-commerce goods.',
      },
    ],
    relatedCalculators: ['container-loading-calculator', 'pallets-per-container-calculator'],
    relatedGuides: ['shipping-container-dimensions', '40ft-container-dimensions'],
    sourceIds: ['container-line-specs'],
  },
  {
    slug: 'how-to-measure-freight',
    path: '/guides/how-to-measure-freight/',
    title: 'How to Measure Freight Accurately',
    h1: 'How to Measure Freight Accurately: Outermost Dimensions & Overhang',
    metaTitle: 'How to Measure Freight Accurately — Avoid Re-Weigh Adjustments',
    metaDescription:
      'Learn how to measure freight like a carrier dimensioning scanner. Rules for outermost bulges, pallet bases, irregular cargo, and certified scale weights.',
    category: 'Packaging',
    summary:
      'A practical measuring manual for warehouse staff and shippers explaining how automated carrier laser scanners evaluate package dimensions.',
    readingTime: '4 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Outermost Point Rule',
        content:
          'Carriers measure freight using laser dimensioners that construct an imaginary rectangular box (bounding cuboid) around the outermost points of the shipment. Dimensions must be measured from extreme edge to extreme edge, including box flaps, bulges, handles, and pallet overhang.',
      },
      {
        title: 'Measuring Loaded Pallets',
        content:
          '* Length and Width: Measure the widest point. If cartons hang over the pallet deck by 1 inch on each side, the measured width is pallet width + 2 inches.\n* Height: Measure from the warehouse floor to the highest peak of the cargo. Always include the thickness of the pallet deck (typically 4.75 to 5.5 inches).',
      },
    ],
    relatedCalculators: ['freight-density-calculator', 'package-girth-calculator', 'pallet-calculator'],
    relatedGuides: ['how-to-calculate-freight-class', 'ti-hi-pallet-patterns'],
    sourceIds: ['nmfta-density-structure', 'parcel-dim-us'],
  },
  {
    slug: 'right-size-packaging-for-dimensional-weight',
    path: '/guides/right-size-packaging-for-dimensional-weight/',
    title: 'Right-Size Packaging for Dimensional Weight',
    h1: 'Right-Sizing Packaging: Eliminate Voids and Cut Dimensional Weight',
    metaTitle: 'Right-Sizing Packaging — Void Reduction & DIM Weight Cost Savings',
    metaDescription:
      'Practical packaging engineering tips to right-size shipping boxes. Eliminate empty void fill, reduce dimensional weight charges, and cut transport costs.',
    category: 'Packaging',
    summary:
      'Strategies for ecommerce operators and procurement teams to engineer optimal box sizes, eliminate empty space, and reduce dimensional weight fees.',
    readingTime: '5 min read',
    lastVerified: '2026-10-06',
    sections: [
      {
        title: 'The Financial Cost of Empty Space',
        content:
          'Because carriers charge on dimensional weight whenever volume exceeds actual weight, shipping empty space is extraordinarily expensive. Trimming just 1 inch off each side of a 14 × 12 × 10 inch carton reduces cubic volume from 1,680 in³ to 1,287 in³—a 23.4% reduction in dimensional weight.',
      },
      {
        title: 'Engineering Steps for Right-Sizing',
        content:
          '1. Standardize on custom-scored cartons that fold down to multiple heights.\n2. Use automated on-demand box-making systems or tight tolerance carton sizing.\n3. Replace bulky loose-fill peanuts with form-fitting molded pulp or paper wrap.\n4. Plan product nested orientations using rectangular packing tools.',
      },
    ],
    relatedCalculators: ['box-size-calculator', 'dimensional-weight-calculator', 'box-volume-calculator'],
    relatedGuides: ['dimensional-weight-formula', 'actual-weight-vs-dimensional-weight'],
    sourceIds: ['parcel-dim-us'],
  },
];

export const getGuideBySlug = (slug: string): GuideMeta | undefined =>
  guides.find((g) => g.slug === slug);
