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
    relatedGuides: ['how-to-calculate-freight-class', 'nmfc-2025-changes', 'freight-density-explained'],
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
    slug: 'nmfc-2025-changes',
    path: '/guides/nmfc-2025-changes/',
    title: 'NMFC 2025 Changes',
    h1: 'NMFC 2025 Changes: Transition and Current Standard',
    metaTitle: 'NMFC 2025 Changes — Historical Transition & Current Rules',
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
    h1: 'Dimensional Weight Formula: Divisors, Calculations, and Carrier Rules',
    metaTitle: 'Dimensional Weight Formula — Divisors (139, 166, 5000) & USPS Rules',
    metaDescription:
      'Learn how the dimensional (volumetric) weight formula works across parcel and express shipping. Comprehensive guide to divisors 139, 166, and USPS DMM rules.',
    category: 'Packaging',
    summary:
      'A technical explanation of the dimensional weight formula, carrier divisors (139 vs 166), USPS DMM standards, and service-specific eligibility rules.',
    readingTime: '6 min read',
    lastVerified: '2026-10-09',
    sections: [
      {
        title: 'The Core Dimensional Weight Equation',
        content:
          'Dimensional weight reflects the minimum density floor expected by carriers for package transportation. The fundamental equation is:\n\nDIM Weight = (Length × Width × Height) ÷ Divisor\n\nWhere package dimensions are measured in inches or centimeters, and divided by a carrier-specified volumetric factor (divisor). The resulting dimensional weight is then compared against actual scale weight: the carrier charges for whichever is greater (Billable Weight = max(Actual Weight, DIM Weight)).',
      },
      {
        title: 'Verified Carrier Divisors & Rate Categories',
        content:
          'Carrier divisors depend strictly on carrier mode, service level, rate tier, and parcel geometry. They must not be applied universally across all services:',
        table: {
          caption: 'Verified Published Dimensional Weight Divisors',
          head: ['Carrier / Service', 'Divisor & Unit', 'Eligibility & Conditions'],
          rows: [
            ['UPS U.S. Daily Rates', '139 in³/lb', 'Standard commercial accounts and scheduled daily pickup. Fractional dimensions rounded up to next whole inch; whole-pound weight rounding.'],
            ['UPS U.S. Retail Rates', '166 in³/lb', 'The UPS Store and customer counter retail rates for domestic U.S. shipments. Fractional dimensions rounded up to next whole inch; whole-pound rounding.'],
            ['FedEx Express & Ground', '139 in³/lb', 'Standard domestic U.S. commercial rates. Dimensions rounded to the nearest whole inch per FedEx packaging guidance; whole-pound weight rounding.'],
            ['USPS Retail Priority Mail', '139 in³/lb', 'Parcels exceeding 1,728 in³ (1 cu ft) addressed to Zones 1–9. Divisor 139 applies to both rectangular (DMM 123.1.3.2) and nonrectangular parcels (with 0.785 shape factor per DMM 123.1.3.3). Dimensions rounded up to whole inches; dim weights over 70 lb billed at 70-lb price.'],
            ['USPS Commercial Priority Mail', '139 / 166 in³/lb', 'Parcels exceeding 1,728 in³ to Zones 1–9. Rectangular parcels use 139 (dimensions round up, DMM 223.1.4.2); nonrectangular parcels use 166 with 0.785 shape factor (measurements round off to nearest whole inch, DMM 223.1.4.3). Dim weights over 70 lb billed at 70-lb price.'],
            ['USPS Priority Mail Express', '139 in³/lb', 'Retail (DMM 113.1.3, sections 113.1.3.2 & 113.1.3.3) & Commercial (DMM 213.1.4, sections 213.1.4.2 & 213.1.4.3) parcels exceeding 1,728 in³ to Zones 1–9. Both use 139 divisor with 0.785 nonrectangular factor (dimensions round up). Initial 0.5-lb price increment; dim weights over 70 lb billed at 70-lb price.'],
            ['DHL Express / International Courier', '5,000 cm³/kg', 'Standard international express metric courier tariffs evaluated per piece.'],
            ['IATA Commercial Air Cargo', '6,000 cm³/kg', 'General airline air freight convention (TACT Rule 3.9.4; 1 cbm = 166.67 kg). Evaluated for total shipment.'],
          ],
        },
      },
      {
        title: 'USPS Dimensional Weight Thresholds & Nonrectangular Rules',
        content:
          'The U.S. Postal Service Domestic Mail Manual (DMM 113, 123, 213, 223) specifies the exact procedure and order of operations for dimensional weight:\n\n1. Dimension Measurement: Round each exterior measurement (length, width, height at extreme points). For rectangular parcels across all services and USPS Retail nonrectangular parcels (DMM 123.1.3.2, 123.1.3.3, 113.1.3.2, 113.1.3.3, 213.1.4.2, 223.1.4.2), round each dimension up to the next whole inch. For USPS Commercial Priority Mail nonrectangular parcels (DMM 223.1.4.3), round off each measurement to the nearest whole inch (fractions 0.5 and above round up; under 0.5 round down).\n2. Volume Calculation: Calculate raw cubic volume (Length × Width × Height).\n3. Nonrectangular Adjustment: For nonrectangular or cylindrical parcels, multiply the volume by 0.785 (the exact factor specified in DMM 123.1.3.3, 223.1.4.3, 113.1.3.3, and 213.1.4.3; do not substitute π/4).\n4. Threshold Evaluation: Compare the adjusted volume to the 1 cubic foot threshold (1,728 cubic inches). If volume does not exceed 1,728 in³, dimensional weight does NOT apply; the package is rated on actual scale weight (subject to service increments, such as 0.5 lb for Express or whole pounds for Priority Mail).\n5. Divisor & Weight Rounding: If volume exceeds 1,728 in³, divide by the service divisor (139 for Retail Priority Mail per DMM 123.1.3, 139 rect / 166 nonrect for Commercial Priority Mail per DMM 223.1.4, 139 for Priority Mail Express per DMM 113.1.3 & 213.1.4) and round dimensional weight up to the next whole pound.\n6. 70-Pound Pricing Cap: Per DMM standards, if the calculated dimensional weight exceeds 70 pounds, the piece is charged the 70-pound price rather than an uncapped rate.\n7. Rating Basis: The parcel is charged based on the greater of actual weight or dimensional weight. Applicable surcharges and zone rates may also apply.',
      },
      {
        title: 'How Divisors Relate to Density',
        content:
          'A carrier divisor represents the minimum shipment density below which dimensional pricing applies:\n\n* A 139 divisor represents a density threshold of ~12.43 lb/ft³ (1,728 ÷ 139).\n* A 166 divisor represents a density threshold of ~10.41 lb/ft³ (1,728 ÷ 166).\n* A 5,000 cm³/kg metric divisor represents 200 kg/m³ (~12.49 lb/ft³).\n* A 6,000 cm³/kg metric divisor represents 166.67 kg/m³ (~10.40 lb/ft³).\n\nA smaller divisor produces a higher dimensional weight, resulting in higher shipping charges for low-density cargo.',
      },
    ],
    relatedCalculators: ['dimensional-weight-calculator', 'air-freight-chargeable-weight-calculator', 'package-girth-calculator'],
    relatedGuides: ['actual-weight-vs-dimensional-weight', 'right-size-packaging-for-dimensional-weight'],
    sourceIds: ['parcel-dim-us', 'fedex-ups-rounding', 'usps-dmm-standards', 'ups-tariff-limits', 'fedex-dim-guidance'],
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
      'Learn what TI and HI mean in warehousing. Understand column vs interlocking stacking, overhang effects, and why geometric calculations differ from structural engineering.',
    category: 'Pallet Planning',
    summary:
      'A practical guide to pallet stacking geometry, explaining how tier count (TI) and height (HI) determine pallet load spatial arrangement, with key distinctions between geometry and structural safety.',
    readingTime: '5 min read',
    lastVerified: '2026-10-09',
    sections: [
      {
        title: 'Understanding TI and HI',
        content:
          'In warehouse operations, pallet stacking is defined by two fundamental metrics:\n\n* TI (Tier): The number of cartons placed on a single layer of the pallet deck footprint.\n* HI (High): The number of layers stacked vertically within allowable height limits.\n\nTotal Cartons = TI × HI. For example, a pallet with 8 cartons per layer stacked 5 layers high has a TI of 8 and HI of 5, holding 40 cartons total.',
      },
      {
        title: 'Column Stacking vs Interlocking Configurations',
        content:
          '* Column Stacking (Aligned): Cartons are aligned corner-to-corner directly over the layer below. Because corrugated carton corners bear the majority (~60–70%) of vertical compressive load, column alignment maximizes structural compression resistance. However, unbanded columns have low inter-layer friction and require stretch-wrap containment to prevent layer shifting in transit.\n* Interlocking Stacking (Pinwheel / Brickwork): Cartons are rotated on alternating layers to interlock the unit load. While interlocking increases unit load cohesion, packaging literature notes that placing corners over weaker center-panel spans noticeably reduces bottom-box compression resistance compared to aligned columns.',
      },
      {
        title: 'Pallet Overhang and Edge Support',
        content:
          'Allowing cartons to overhang the perimeter of a wooden or plastic pallet deck removes direct support beneath the carton corners. In distribution environments, unsupported perimeter edges substantially degrade box stacking durability and leave cartons vulnerable to impact punctures from forklift tines and adjacent pallet loads.',
      },
      {
        title: 'Geometric Pallet Calculation vs Structural Load Engineering',
        content:
          'Important distinction: FreightPlanHQ’s pallet calculator provides a geometric spatial optimization—calculating how many rectangular boxes fit across a 2D pallet footprint within target vertical height bounds. This geometric calculation does NOT establish that a load is structurally safe to ship.\n\nSafe pallet shipment requires evaluating corrugated flute type (B, C, or double-wall), Edge Crush Test (ECT) ratings, environmental humidity degradation, stretch-film containment tension, and dynamic transit vibration (under standards such as ASTM D4169 or ISTA 3A). Shippers should perform physical load testing or packaging engineering reviews for fragile or heavy freight.',
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
  {
    slug: 'ltl-linear-feet-explained',
    path: '/guides/ltl-linear-feet-explained/',
    title: 'LTL Linear Feet Explained',
    h1: 'LTL Linear Feet Explained: Trailer Floor Space, Pallet Turning & Rules',
    metaTitle: 'LTL Linear Feet Explained — Trailer Floor Space & Cubic Rules',
    metaDescription:
      'Learn how LTL freight carriers calculate trailer linear feet. Understand straight, turned, and pinwheeled pallet patterns, NMFC Item 110, and carrier cubic capacity rules.',
    category: 'Containers & Trailers',
    summary:
      'A practical guide to Less-Than-Truckload (LTL) linear footage, showing how carriers calculate floor space used, how pallet orientation affects footage, and how to avoid linear foot surcharge penalties.',
    readingTime: '6 min read',
    lastVerified: '2026-10-10',
    sections: [
      {
        title: 'What Are Linear Feet in LTL Freight?',
        content:
          'In North American Less-Than-Truckload (LTL) transportation, "linear feet" measures the lengthwise distance (in feet) a shipment occupies along the trailer floor from front to back. A standard 53-foot dry van trailer offers 53 linear feet of floor deck across an interior width of 98 to 102 inches (modeled with 96 inches / 8.0 feet of usable deck width to accommodate wall clearance and operational loading tolerances).',
      },
      {
        title: 'GMA Pallet Loading Configurations & Worked Examples',
        content:
          'Standard North American GMA pallets measure 48 inches long by 40 inches wide. Because they are rectangular, pallet orientation directly impacts the linear footage billed by the carrier:\n\n* Straight Loading (Narrow 40" Face Across Trailer): Two pallets loaded side-by-side with 40-inch faces across occupy 80 inches of trailer width (40" + 40" = 80"). Each two-pallet row extends 48 inches along the trailer length, which equals exactly 4.00 linear feet per two-pallet row (48 in ÷ 12 in/ft = 4.00 ft). A 12-pallet shipment in straight rows occupies 6 rows × 4.00 ft = 24.0 linear feet.\n* Turned Loading (Wide 48" Face Across Trailer): Two pallets loaded side-by-side with 48-inch faces across occupy 96 inches of trailer width (48" + 48" = 96"). Each two-pallet row extends 40 inches along the trailer length, which equals 3.33 linear feet per two-pallet row (40 in ÷ 12 in/ft = 3.333 ft). A 12-pallet shipment in turned rows occupies 6 rows × 3.333 ft = 20.0 linear feet—saving 4.0 linear feet of trailer space. Note: Turned loading requires trailers with at least 98–102 inches of interior width and strict zero carton overhang, as 96 inches leaves zero clearance inside older 96-inch trailers.\n* Alternating / Pinwheeled Loading (Nested 3.67 Linear Foot Average): When trailer width or slight pallet overhang prevents side-by-side turned loading, loaders alternate pallet orientations (pinwheeling) by pairing one straight pallet with one turned pallet across each row:\n  - Width across trailer: One 40-inch face plus one 48-inch face = 88 inches (40" + 48" = 88"), leaving generous 8-to-12 inch clearance inside standard trailers.\n  - Row 1: Left pallet loaded straight (48" deep); Right pallet loaded turned (40" deep).\n  - Row 2: Left pallet loaded turned (40" deep); Right pallet loaded straight (48" deep).\n  - Left side length across the 2-row pair: 48 in + 40 in = 88 inches.\n  - Right side length across the 2-row pair: 40 in + 48 in = 88 inches.\n  - Both sides end flush at 88 inches total length.\n  - Intermediate Arithmetic: 88 inches ÷ 12 inches/ft = 7.333 linear feet for 4 pallets (two rows).\n  - Average per two-pallet row: 7.333 ft ÷ 2 = 3.667 linear feet (~3.67 linear feet per two-pallet row).\n  - Crucial Assumption & Clarification: The 3.67 linear feet figure is a mathematical average across nested, alternating row pairs. A single, isolated two-pallet pinwheeled row physically extends 48 inches (4.00 linear feet) at its furthest point until the subsequent alternating row is nested against it.',
      },
      {
        title: 'NMFC Item 110 Measurement Standards and Deemed Height',
        content:
          'The National Motor Freight Classification (NMFC) Item 110 provides standardized definitions and rules for calculating shipment dimensions, cubic volume, and density:\n\n* Extreme Dimensions (Section 8): NMFC Item 110, Section 8 dictates that shipment dimensions must be determined using the greatest exterior dimensions (length, width, and height), including pallets, packaging, crating, banding, and any carton overhang or hardware protrusions.\n* Non-Stackable Freight & Deemed Dimensions: When freight cannot be double-stacked or top-loaded—due to fragile packaging, pyramid loading, pointed cargo, or explicit shipper "Do Not Stack" instructions—carrier rules tariffs (referencing or extending NMFC principles) routinely deem the freight to occupy the full vertical trailer height (typically 96 to 108 inches) when calculating cubic space.\n* Tariff Authority: NMFC Item 110 defines measurement methodology, but the specific capacity penalties, linear-foot surcharges, and cubic thresholds are NOT set by the NMFTA; they are published independently by each motor carrier in their individual rules tariffs.',
      },
      {
        title: 'Carrier Cubic Capacity Rules & The 750 Cubic Foot Threshold',
        content:
          'Major North American LTL carriers enforce "Cubic Capacity and Density" rules tariffs (often published as Item 100, 390, 430, or 500 series rules) to ensure fair compensation for light, bulky freight that consumes trailer space:\n\n* Typical Industry Thresholds: A commonly cited benchmark is shipments occupying 750 cubic feet or more with an average density of less than 6.0 pounds per cubic foot (PCF). However, thresholds vary widely across carriers; some trigger at 250, 500, or 1,000 cubic feet, or link cubic volume to linear footage (e.g., 14, 15, or 20 linear feet).\n* Trailer Volume Arithmetic: In a standard dry van with ~8.17 feet usable interior width and 9.0 feet interior height (108 in ceiling), 10 linear feet of trailer space encompasses approximately 735 cubic feet of total trailer envelope (10 ft × 8.17 ft × 9.0 ft = 735.3 cu ft). If freight is non-stackable and deemed to the ceiling, 10 to 14 linear feet of floor space readily triggers 750+ cubic foot capacity thresholds.\n* Critical Limitation: There is no universal federal or statutory LTL cubic capacity rule. Each carrier tariff establishes its own cubic triggers, density floors, and penalty formulas (such as forfeiting discounted class rates and applying spot truckload rates or mandatory minimum charges per linear foot). Always inspect your carrier\'s specific rules tariff before tendering high-cube freight.',
      },
      {
        title: 'Formulas for Calculating Trailer Linear Feet',
        content:
          'When pallets cannot be turned (due to carton overhang or forklift restrictions) or have mixed dimensions, linear feet is calculated by:\n\nLinear Feet = (Total Shipment Floor Area in sq ft) ÷ (Usable Trailer Width in feet)\n\nWhere usable trailer width is typically 8.0 feet (96 inches). For non-stackable freight that cannot have cargo placed on top, carriers charge for the entire floor footprint regardless of cargo height.',
      },
    ],
    relatedCalculators: ['linear-feet-calculator', 'loading-meter-calculator', 'pallets-per-container-calculator'],
    relatedGuides: ['standard-pallet-sizes', 'how-to-measure-freight'],
    sourceIds: ['linear-feet-convention', 'nmfta-density-structure'],
  },
];

export const getGuideBySlug = (slug: string): GuideMeta | undefined =>
  guides.find((g) => g.slug === slug);
