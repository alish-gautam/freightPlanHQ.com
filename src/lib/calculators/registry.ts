import type { CalculatorSpec } from './types';

import freightClassSpec from './specs/freight-class-calculator';
import cbmSpec from './specs/cbm-calculator';
import palletSpec from './specs/pallet-calculator';
import dimWeightSpec from './specs/dimensional-weight-calculator';
import containerLoadingSpec from './specs/container-loading-calculator';
import freightDensitySpec from './specs/freight-density-calculator';
import airFreightSpec from './specs/air-freight-chargeable-weight-calculator';
import lclFreightSpec from './specs/lcl-freight-calculator';
import palletsPerContainerSpec from './specs/pallets-per-container-calculator';
import loadingMeterSpec from './specs/loading-meter-calculator';
import linearFeetSpec from './specs/linear-feet-calculator';
import packageGirthSpec from './specs/package-girth-calculator';
import boxSizeSpec from './specs/box-size-calculator';
import boxVolumeSpec from './specs/box-volume-calculator';

export type CalculatorCategory =
  | 'Freight Measurement'
  | 'Pallet Planning'
  | 'Packaging'
  | 'Air & Ocean'
  | 'Containers & Trailers';

export interface WorkedExample {
  title: string;
  scenario: string;
  inputs: { label: string; value: string }[];
  steps: string[];
  result: { label: string; value: string; note?: string };
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface CalculatorMeta {
  slug: string;
  path: string;
  title: string;
  h1: string;
  metaTitle: string;
  metaDescription: string;
  category: CalculatorCategory;
  shortDesc: string;
  flagship?: boolean;
  spec: CalculatorSpec;
  formula: {
    summary: string;
    latexOrCode: string;
    variables: { symbol: string; explanation: string }[];
  };
  workedExample: WorkedExample;
  assumptions: string[];
  limitations: string[];
  disclaimer: string;
  sourceIds: string[];
  relatedCalculators: string[];
  relatedGuides: string[];
  faqs: FaqItem[];
}

export const calculators: CalculatorMeta[] = [
  {
    slug: 'freight-class-calculator',
    path: '/freight-class-calculator/',
    title: 'Freight Class Calculator',
    h1: 'Freight Class Calculator (Estimated Density-Based)',
    metaTitle: 'Freight Class Calculator (Estimated Density-Based) — FreightPlanHQ',
    metaDescription:
      'Estimate LTL freight class using shipment density and the NMFTA 13-sub density structure. Free calculation with step-by-step density and class breakdown.',
    category: 'Freight Measurement',
    shortDesc: 'Calculate shipment density and estimate LTL freight class across the standard 13 density tiers.',
    flagship: true,
    spec: freightClassSpec,
    formula: {
      summary: 'Density (PCF) = Total Gross Weight (lb) ÷ Total Shipment Volume (ft³). The resulting PCF maps to a freight class band.',
      latexOrCode: 'Density = Weight (lb) / Volume (cu ft)',
      variables: [
        { symbol: 'Weight (lb)', explanation: 'Total gross weight of cargo including pallets and packaging' },
        { symbol: 'Volume (ft³)', explanation: 'Cubic feet = (Length × Width × Height in inches) ÷ 1,728' },
        { symbol: 'Class', explanation: 'Class rating (50 to 400) derived from the 13-sub density table' },
      ],
    },
    workedExample: {
      title: 'Standard Pallet Shipment (2 Pallets)',
      scenario: 'A shipper is dispatching 2 standard 48 × 40 × 48 inch pallets weighing 600 lb each (1,200 lb total).',
      inputs: [
        { label: 'Pallet Dimensions', value: '48 × 40 × 48 in each (2 pallets)' },
        { label: 'Weight per Pallet', value: '600 lb' },
        { label: 'Total Weight', value: '1,200 lb' },
      ],
      steps: [
        'Calculate cubic volume per pallet: (48 × 40 × 48) ÷ 1,728 = 53.33 ft³.',
        'Calculate total shipment volume: 53.33 ft³ × 2 = 106.67 ft³.',
        'Calculate density: 1,200 lb ÷ 106.67 ft³ = 11.25 lb/ft³ (PCF).',
        'Look up density in the 13-sub table: 10 to <12 lb/ft³ maps to Freight Class 92.5.',
      ],
      result: {
        label: 'Estimated Freight Class',
        value: 'Class 92.5',
        note: 'Shipment density: 11.25 lb/ft³ across 106.67 ft³.',
      },
    },
    assumptions: [
      'Dimensions must reflect the outermost dimensions of the packaged freight ready to ship.',
      'Density uses total gross weight including pallet bases and banding.',
      'Uses the NMFTA 13-sub full-scale density scale (July 2025 standard).',
    ],
    limitations: [
      'This tool calculates an ESTIMATED density-based freight class only.',
      'Official NMFC item classification also evaluates handling ease, stowability, liability (value/perishability), and item-specific tariff provisions.',
      'This website does not provide official NMFC code lookups.',
    ],
    disclaimer:
      'This is a density-based planning estimate, not an official NMFC commodity classification or carrier tariff guarantee.',
    sourceIds: ['nmfta-density-structure'],
    relatedCalculators: ['freight-density-calculator', 'cbm-calculator', 'pallet-calculator'],
    relatedGuides: ['freight-class-chart', 'how-to-calculate-freight-class', 'nmfc-2025-changes'],
    faqs: [
      {
        question: 'What is freight class?',
        answer:
          'Historically, the National Motor Freight Classification (NMFC) catalog defined 18 numerical classes ranging from Class 50 (densest) to Class 500 (lightest) based on four transport characteristics: density, stowability, handling, and liability. In contrast, this calculator evaluates shipment density against the standardized 13-subprovision density structure (ranging from Class 50 up to Class 400) widely used across North American LTL rating. Official commodity-specific NMFC classifications are assigned exclusively by NMFTA tariffs for specific item numbers—which may include non-density factors or fixed ratings—and cannot be determined by mathematical density alone.',
      },
      {
        question: 'Is density the only factor determining freight class?',
        answer:
          'No. While NMFTA reforms and carrier rules tariffs increasingly map general freight to the standardized 13-subprovision density scale, official NMFC commodity classifications still govern items with specific catalog codes. Official classification evaluates all four historical transport characteristics—density, handling, stowability, and liability (such as perishability, hazardous materials, or high theft value). This calculator provides a mathematical density-based estimate; shipments governed by commodity-specific item numbers or carrier exception tariffs may be rated differently.',
      },
      {
        question: 'How do I avoid freight re-classification penalties?',
        answer:
          'Accurately measure the outermost bulges of your pallets (including overhang and pallet height) and weigh the shipment on a certified scale. Under-reporting dimensions or weight frequently results in carrier re-weigh and re-measurement inspection fees.',
      },
    ],
  },
  {
    slug: 'cbm-calculator',
    path: '/cbm-calculator/',
    title: 'CBM Calculator',
    h1: 'CBM Calculator (Cubic Meter Shipping Volume)',
    metaTitle: 'CBM Calculator — Calculate Cubic Meters for Shipping — FreightPlanHQ',
    metaDescription:
      'Calculate total shipment volume in CBM (cubic meters) and cubic feet across multiple carton sizes and SKUs. Fast, multi-row cargo volume planning.',
    category: 'Freight Measurement',
    shortDesc: 'Calculate total shipment volume in cubic meters (CBM) and cubic feet across multiple cargo rows.',
    flagship: true,
    spec: cbmSpec,
    formula: {
      summary: 'CBM = (Length × Width × Height in meters) × Quantity. Converts automatically from mm, cm, m, inches, and feet.',
      latexOrCode: 'CBM = (L * W * H in meters) * Quantity',
      variables: [
        { symbol: 'L, W, H', explanation: 'Outer package dimensions converted into meters' },
        { symbol: 'Qty', explanation: 'Total carton or piece count for that row' },
        { symbol: 'Total CBM', explanation: 'Sum of CBM across all cargo lines' },
      ],
    },
    workedExample: {
      title: 'Multi-Carton Export Shipment',
      scenario: 'An exporter has 50 cartons measuring 60 × 40 × 40 cm and 20 cartons measuring 50 × 50 × 30 cm.',
      inputs: [
        { label: 'Line 1 Cartons', value: '50 cartons @ 60 × 40 × 40 cm' },
        { label: 'Line 2 Cartons', value: '20 cartons @ 50 × 50 × 30 cm' },
      ],
      steps: [
        'Line 1 CBM: 0.60 m × 0.40 m × 0.40 m × 50 = 4.80 CBM.',
        'Line 2 CBM: 0.50 m × 0.50 m × 0.30 m × 20 = 1.50 CBM.',
        'Total Shipment CBM: 4.80 + 1.50 = 6.30 CBM.',
        'Equivalent cubic feet: 6.30 × 35.3147 = 222.48 ft³.',
      ],
      result: {
        label: 'Total Shipment Volume',
        value: '6.300 CBM',
        note: '70 total cartons, 222.48 ft³.',
      },
    },
    assumptions: [
      'Volume reflects gross exterior carton measurements.',
      'Dimensions are converted internally to canonical meters before multiplication.',
      'Does not account for pallet base volume unless a pallet line is added.',
    ],
    limitations: [
      'Cargo CBM reflects carton displacement, not necessarily container fill efficiency.',
      'Irregular shapes and bulging boxes will occupy more space than nominal dimensions.',
    ],
    disclaimer:
      'Shipment CBM is calculated from user-entered dimensions. Carriers measure outermost package bulges.',
    sourceIds: ['lcl-wm', 'container-line-specs'],
    relatedCalculators: ['box-volume-calculator', 'freight-density-calculator', 'lcl-freight-calculator', 'container-loading-calculator'],
    relatedGuides: ['what-is-cbm', 'how-to-calculate-cbm', 'how-to-measure-freight'],
    faqs: [
      {
        question: 'What does CBM stand for?',
        answer: 'CBM stands for Cubic Meter (m³). It is the standard metric measurement unit for freight volume in international ocean shipping, air cargo, and logistics.',
      },
      {
        question: 'How do you calculate CBM from inches?',
        answer: 'Multiply Length × Width × Height in inches, divide by 1,728 to get cubic feet, and then divide by 35.3147 (or multiply inches by 0.0254 to convert to meters before multiplying).',
      },
      {
        question: 'How many CBM fit into a 20ft container?',
        answer: 'A standard 20ft dry container has a nominal interior volume of ~33.2 CBM, but realistically accommodates 25 to 28 CBM of packed cartons depending on carton dimensions and stacking.',
      },
    ],
  },
  {
    slug: 'pallet-calculator',
    path: '/pallet-calculator/',
    title: 'Pallet Loading & Stacking Calculator',
    h1: 'Pallet Loading & Stacking Calculator (TI × HI)',
    metaTitle: 'Pallet Calculator — Boxes Per Pallet & TI × HI Stacking — FreightPlanHQ',
    metaDescription:
      'Calculate cartons per pallet, TI × HI layer configurations, loaded pallet height, payload, and weight. Features visual top-view and side-elevation layout diagrams.',
    category: 'Pallet Planning',
    shortDesc: 'Determine cartons per pallet, TI × HI stacking configurations, loaded height, gross weight, and visual layouts.',
    flagship: true,
    spec: palletSpec,
    formula: {
      summary: 'TI = Cartons per layer (tested across aligned, rotated, and mixed strip patterns). HI = Layers high. Total Cartons = TI × HI.',
      latexOrCode: 'Cartons per Pallet = TI * HI',
      variables: [
        { symbol: 'TI', explanation: 'Tier count: cartons arranged on the pallet deck footprint' },
        { symbol: 'HI', explanation: 'High count: number of vertical layers within height limits' },
        { symbol: 'Gross Weight', explanation: 'Cargo Weight + Pallet Tare Weight' },
      ],
    },
    workedExample: {
      title: 'Standard GMA Pallet Stacking',
      scenario: 'Loading 400 × 300 × 250 mm cartons weighing 12 kg each onto a standard 1200 × 1000 mm pallet (tare 25 kg, max height 1800 mm).',
      inputs: [
        { label: 'Carton Dims', value: '400 × 300 × 250 mm, 12 kg' },
        { label: 'Pallet Dims', value: '1200 × 1000 mm, deck 150 mm' },
        { label: 'Max Height', value: '1800 mm' },
      ],
      steps: [
        'Pallet footprint 1200 × 1000 mm accommodates 10 cartons per layer (3 rows of 400mm along length = 1200mm; widths 300+300+300 = 900mm fits 1000mm).',
        'Available height: 1800 mm - 150 mm deck = 1650 mm for cartons.',
        'Layers (HI): floor(1650 ÷ 250) = 6 layers high.',
        'Cartons per pallet: 10 per layer × 6 layers = 60 cartons per pallet.',
        'Gross pallet weight: (60 × 12 kg) + 25 kg tare = 745 kg.',
      ],
      result: {
        label: 'Best Evaluated Layout',
        value: '60 cartons / pallet (TI 10 × HI 6)',
        note: 'Loaded height: 1650 mm. Gross weight: 745 kg.',
      },
    },
    assumptions: [
      'Evaluates rectangular floor packings (aligned and rotated strip orientations).',
      'Loaded height includes the thickness of the pallet deck.',
      'Weight capacity checks cargo payload against entered pallet maximums.',
    ],
    limitations: [
      'Represents best feasible rectangular arrangements evaluated, not a proven global mathematical maximum for non-orthogonal arrangements.',
      'Does not model box bulging, strapping tension, or shrink-wrap compression.',
    ],
    disclaimer:
      'Geometric spatial layout estimate only. Does not constitute an engineering determination of carton compression strength, pallet overhang safety, or transit stability. Verify box compression ratings (ECT) and securing methods prior to transport.',
    sourceIds: ['iso-6780', 'epal-euro-pallet'],
    relatedCalculators: ['pallets-per-container-calculator', 'container-loading-calculator', 'box-size-calculator'],
    relatedGuides: ['standard-pallet-sizes', 'ti-hi-pallet-patterns', 'how-to-measure-freight'],
    faqs: [
      {
        question: 'What does TI and HI mean in warehousing?',
        answer: 'TI (Tier) is the number of cartons that fit on a single pallet layer. HI (High) is the number of layers stacked vertically. TI × HI equals the total cartons per pallet.',
      },
      {
        question: 'What is a standard pallet size in the US vs Europe?',
        answer: 'In the US and Canada, the standard GMA pallet is 48 × 40 inches (1219 × 1016 mm). In Europe, the standard EUR/EPAL pallet is 1200 × 800 mm.',
      },
      {
        question: 'Should boxes overhang the pallet edge?',
        answer: 'Generally, no. Overhang removes direct deck support from underneath the carton corners—where ~60–70% of corrugated compressive strength is concentrated—and exposes packaging to puncture damage during forklift handling and racking.',
      },
    ],
  },
  {
    slug: 'dimensional-weight-calculator',
    path: '/dimensional-weight-calculator/',
    title: 'Dimensional Weight Calculator',
    h1: 'Dimensional Weight Calculator (DIM / Volumetric Weight)',
    metaTitle: 'Dimensional Weight Calculator — Parcel & Express Divisors — FreightPlanHQ',
    metaDescription:
      'Calculate dimensional weight and compare against actual weight to determine billable weight across carrier divisors (139, 166, 5000) and custom presets.',
    category: 'Packaging',
    shortDesc: 'Calculate dimensional (volumetric) weight and find billable weight using standard carrier divisors.',
    flagship: true,
    spec: dimWeightSpec,
    formula: {
      summary: 'DIM Weight = (Length × Width × Height) ÷ Divisor. Billable Weight = max(Actual Weight, DIM Weight).',
      latexOrCode: 'DIM Weight = (L * W * H) / Divisor',
      variables: [
        { symbol: 'L, W, H', explanation: 'Outer package dimensions in inches or centimeters' },
        { symbol: 'Divisor', explanation: 'Carrier dimensional factor (e.g. 139 in³/lb, 166 in³/lb, 5000 cm³/kg)' },
        { symbol: 'Billable Weight', explanation: 'The higher of actual weight or dimensional weight' },
      ],
    },
    workedExample: {
      title: 'E-commerce Parcel (Standard US 139 Divisor)',
      scenario: 'A parcel measuring 20 × 16 × 12 inches has an actual weight of 18 lb. Carrier publishes a standard 139 divisor.',
      inputs: [
        { label: 'Package Dims', value: '20 × 16 × 12 inches' },
        { label: 'Actual Weight', value: '18.0 lb' },
        { label: 'Carrier Divisor', value: '139 in³/lb' },
      ],
      steps: [
        'Calculate cubic inches: 20 × 16 × 12 = 3,840 in³.',
        'Apply 139 divisor: 3,840 ÷ 139 = 27.63 lb dimensional weight.',
        'Compare actual vs DIM weight: max(18.0 lb, 27.63 lb) = 27.63 lb billable.',
        'Identify billing basis: Dimensional weight exceeds actual weight by 9.63 lb.',
      ],
      result: {
        label: 'Billable Weight',
        value: '27.63 lb',
        note: 'Billed on dimensional weight (actual was 18.0 lb).',
      },
    },
    assumptions: [
      'Divisor unit system matches entered dimension and weight units.',
      'Evaluates on a per-package or whole-shipment basis according to selected service rule.',
      'Does not automatically round up fractional inches unless the rounding toggle is enabled.',
    ],
    limitations: [
      'Carrier contract divisors frequently differ from published retail counter rates.',
      'Dimensional weight does not include carrier fuel surcharges, peak surcharges, or delivery area fees.',
    ],
    disclaimer:
      'Carrier and service divisors vary by contract and tariff. Confirm your agreement before booking.',
    sourceIds: ['parcel-dim-us', 'fedex-ups-rounding'],
    relatedCalculators: ['air-freight-chargeable-weight-calculator', 'package-girth-calculator', 'box-size-calculator'],
    relatedGuides: ['dimensional-weight-formula', 'actual-weight-vs-dimensional-weight', 'right-size-packaging-for-dimensional-weight'],
    faqs: [
      {
        question: 'Why do carriers charge for dimensional weight?',
        answer: 'Transportation vehicles (aircraft, vans, trailers) fill up with volume long before they reach maximum weight capacity. Dimensional weight ensures carriers are paid for space occupied by lightweight, bulky boxes.',
      },
      {
        question: 'What is the standard DIM divisor for UPS and FedEx?',
        answer: 'The standard domestic US published counter divisor is 139 in³/lb for daily rates and 5,000 cm³/kg for metric rates. Retail rates and negotiated commercial contracts often use 166 in³/lb or custom divisors.',
      },
      {
        question: 'How do I reduce dimensional weight charges?',
        answer: 'Right-size packaging to eliminate empty void space, choose custom cartons, and eliminate bulky excess bubble wrap or dunnage.',
      },
    ],
  },
  {
    slug: 'container-loading-calculator',
    path: '/container-loading-calculator/',
    title: 'Container Loading Calculator',
    h1: 'Container Loading Calculator (3D Box Packing)',
    metaTitle: 'Container Loading Calculator — 20ft & 40ft Packing Heuristic — FreightPlanHQ',
    metaDescription:
      'Plan 3D rectangular box packing into 20ft, 40ft, and 40ft High Cube ocean containers. Calculates loaded count, cubic utilization, payload, and visual coordinates.',
    category: 'Containers & Trailers',
    shortDesc: 'Plan 3D box packing into 20ft, 40ft, and 40ft High Cube containers with payload and volume utilization.',
    flagship: true,
    spec: containerLoadingSpec,
    formula: {
      summary: 'Deterministic 3D rectangular layer and strip packing algorithm. Enforces container internal dimensions, door openings, cargo payload, and orientation limits.',
      latexOrCode: 'Cube Utilization = (Boxes Loaded * Box Volume) / Container Volume',
      variables: [
        { symbol: 'Boxes Loaded', explanation: 'Actual count placed without overlap within boundary constraints' },
        { symbol: 'Payload kg', explanation: 'Total gross weight vs maximum permitted equipment payload' },
        { symbol: 'Cube Util %', explanation: 'Ratio of cargo volume to interior container volume' },
      ],
    },
    workedExample: {
      title: 'Loading 20ft Dry Container with Export Cartons',
      scenario: 'Packing 500 × 400 × 300 mm cartons weighing 15 kg each into a standard 20ft container (5896 × 2350 × 2393 mm, 28,200 kg payload).',
      inputs: [
        { label: 'Carton Dims', value: '500 × 400 × 300 mm, 15 kg each' },
        { label: 'Equipment', value: '20 ft standard (internal 5.89 × 2.35 × 2.39 m)' },
        { label: 'Target Order Qty', value: '600 cartons' },
      ],
      steps: [
        'Test candidate layer heights (300, 400, 500 mm).',
        'In upright orientation (height = 300 mm), container height 2393 mm accommodates 7 layers.',
        'Floor packing places 27 cartons per layer.',
        'Total cartons packed: 27 × 7 = 189 cartons (tested multi-orientation fills to capacity).',
        'Payload verified: 189 × 15 kg = 2,835 kg (well below 28,200 kg payload limit).',
      ],
      result: {
        label: 'Best Feasible Layout Found',
        value: 'Cartons loaded within constraints',
        note: 'Driven by deterministic coordinate placement engine.',
      },
    },
    assumptions: [
      'Boxes are rigid rectangular cuboids placed along orthogonal Cartesian axes.',
      'Equipment specifications represent standard reference dry containers (CSC plate specs).',
      'Non-random, deterministic heuristic evaluation prioritizing constraint safety.',
    ],
    limitations: [
      'Represents best tested arrangement found; not a mathematical global optimum.',
      'Real container loading requires allowance for dunnage, air bags, floor lashing, and door sill clearance.',
    ],
    disclaimer:
      'Container specifications vary by manufacturer and steamship line. Check the CSC plate on your container.',
    sourceIds: ['container-line-specs'],
    relatedCalculators: ['pallets-per-container-calculator', 'cbm-calculator', 'pallet-calculator'],
    relatedGuides: ['shipping-container-dimensions', '20ft-container-dimensions', '40ft-container-dimensions', '40ft-high-cube-container-dimensions'],
    faqs: [
      {
        question: 'What is the difference between a 40ft standard and 40ft High Cube container?',
        answer: 'Both have the same length (12.03 m) and width (2.35 m), but a 40ft High Cube is 1 foot (30 cm) taller inside (2.70 m vs 2.39 m), providing ~76 CBM of volume versus ~67 CBM.',
      },
      {
        question: 'Why doesn’t carton volume divide evenly into container volume?',
        answer: 'Carton geometry and physical orientation prevent 100% space filling. Gaps between cartons and roof clearance typically limit real-world cubic utilization to 80–88%.',
      },
      {
        question: 'Can I exceed the container payload if there is still space inside?',
        answer: 'Never. Exceeding maximum payload violates SOLAS VGM regulations, damages equipment, and risks port rejection or severe fines.',
      },
    ],
  },
  {
    slug: 'freight-density-calculator',
    path: '/freight-density-calculator/',
    title: 'Freight Density Calculator',
    h1: 'Freight Density Calculator (PCF & kg/m³)',
    metaTitle: 'Freight Density Calculator — Calculate PCF & kg/m³ — FreightPlanHQ',
    metaDescription:
      'Calculate freight density in pounds per cubic foot (PCF) and kilograms per cubic meter (kg/m³) for LTL shipping and freight classification.',
    category: 'Freight Measurement',
    shortDesc: 'Calculate shipment density in pounds per cubic foot (PCF) and kilograms per cubic meter (kg/m³).',
    spec: freightDensitySpec,
    formula: {
      summary: 'Density = Total Gross Weight ÷ Total Cubic Volume. Supports lb/ft³ (PCF) and kg/m³.',
      latexOrCode: 'Density = Weight / Volume',
      variables: [
        { symbol: 'PCF', explanation: 'Pounds per cubic foot = Weight (lb) ÷ Volume (ft³)' },
        { symbol: 'kg/m³', explanation: 'Kilograms per cubic meter = Weight (kg) ÷ Volume (m³)' },
      ],
    },
    workedExample: {
      title: 'Industrial Machinery Crate',
      scenario: 'A wooden crate measures 60 × 48 × 36 inches and weighs 750 lb on the scale.',
      inputs: [
        { label: 'Crate Dimensions', value: '60 × 48 × 36 inches' },
        { label: 'Gross Weight', value: '750 lb' },
      ],
      steps: [
        'Calculate cubic volume: (60 × 48 × 36) ÷ 1,728 = 60.0 ft³.',
        'Calculate density: 750 lb ÷ 60.0 ft³ = 12.50 lb/ft³ (PCF).',
        'Metric equivalent: 750 lb = 340.19 kg; 60 ft³ = 1.699 m³ → 200.2 kg/m³.',
      ],
      result: {
        label: 'Freight Density',
        value: '12.50 lb/ft³',
        note: '200.2 kg/m³ across 60.0 ft³.',
      },
    },
    assumptions: [
      'Dimensions reflect outer boundary measurements including skids, crating, and handles.',
      'Weight includes total tare and packaging.',
    ],
    limitations: [
      'Density alone does not guarantee a specific freight class if special commodity rules apply.',
    ],
    disclaimer:
      'Freight density depends strictly on outer dimensions and certified scale weight.',
    sourceIds: ['nmfta-density-structure'],
    relatedCalculators: ['freight-class-calculator', 'cbm-calculator'],
    relatedGuides: ['freight-density-explained', 'how-to-calculate-freight-class'],
    faqs: [
      {
        question: 'What is PCF in shipping?',
        answer: 'PCF stands for Pounds per Cubic Foot. It is the primary metric used by North American freight carriers to evaluate shipment density and determine LTL freight class.',
      },
      {
        question: 'How do you convert PCF to kg/m³?',
        answer: 'Multiply PCF by 16.0185 to get kg/m³. For example, 10 lb/ft³ equals approximately 160.2 kg/m³.',
      },
    ],
  },
  {
    slug: 'air-freight-chargeable-weight-calculator',
    path: '/air-freight-chargeable-weight-calculator/',
    title: 'Air Freight Chargeable Weight Calculator',
    h1: 'Air Freight Chargeable Weight Calculator',
    metaTitle: 'Air Freight Chargeable Weight Calculator — IATA 1:6000 — FreightPlanHQ',
    metaDescription:
      'Calculate air cargo chargeable weight using IATA 6,000 cm³/kg and courier 5,000 cm³/kg conventions. Multi-piece volumetric weight comparison.',
    category: 'Air & Ocean',
    shortDesc: 'Determine air cargo volumetric weight and billable chargeable weight using standard IATA conventions.',
    spec: airFreightSpec,
    formula: {
      summary: 'Volumetric Weight = (Length × Width × Height in cm) ÷ Divisor. Chargeable Weight = max(Gross Weight, Volumetric Weight).',
      latexOrCode: 'Volumetric Weight (kg) = Volume (cm³) / 6000',
      variables: [
        { symbol: 'Gross Weight', explanation: 'Actual scale weight in kg' },
        { symbol: 'Volumetric Weight', explanation: 'Volume in cm³ divided by 6,000 (IATA convention) or 5,000 (express)' },
        { symbol: 'Chargeable Weight', explanation: 'The higher weight used for airline billing' },
      ],
    },
    workedExample: {
      title: 'Commercial Air Cargo Consignment (3 Boxes)',
      scenario: '3 export cartons measuring 100 × 60 × 50 cm each, weighing 40 kg each (120 kg total gross weight).',
      inputs: [
        { label: 'Cartons', value: '3 cartons @ 100 × 60 × 50 cm' },
        { label: 'Gross Weight', value: '40 kg each (120 kg total)' },
        { label: 'Volumetric Divisor', value: '6,000 cm³/kg (IATA standard)' },
      ],
      steps: [
        'Volume per carton: 100 × 60 × 50 = 300,000 cm³.',
        'Total volume: 300,000 cm³ × 3 = 900,000 cm³ (0.90 CBM).',
        'Volumetric weight: 900,000 ÷ 6,000 = 150.0 kg.',
        'Compare against actual weight (120.0 kg): max(120.0, 150.0) = 150.0 kg.',
      ],
      result: {
        label: 'Chargeable Weight',
        value: '150.0 kg',
        note: 'Volumetric weight exceeded actual weight by 30.0 kg.',
      },
    },
    assumptions: [
      'Standard general air cargo uses the 1:6 ratio (1 CBM = 167 kg, divisor 6,000 cm³/kg).',
      'Shipment-level calculation compares aggregate actual weight against aggregate volumetric weight.',
    ],
    limitations: [
      'Airlines and express couriers may use different divisors (e.g. 5,000 cm³/kg for express).',
      'Rounding rules (e.g. rounding to whole or half kg) vary by carrier tariff.',
    ],
    disclaimer:
      'Confirm the divisor and rounding rules used by your airline, forwarder, or service before booking.',
    sourceIds: ['iata-volumetric'],
    relatedCalculators: ['cbm-calculator', 'dimensional-weight-calculator'],
    relatedGuides: ['air-freight-chargeable-weight', 'dimensional-weight-formula'],
    faqs: [
      {
        question: 'What is the IATA volumetric ratio for air freight?',
        answer: 'The standard IATA volumetric ratio is 1:6, meaning 1 cubic meter of cargo equals 166.67 kilograms of volumetric weight (using a divisor of 6,000 cm³ per kg).',
      },
      {
        question: 'What is chargeable weight?',
        answer: 'Chargeable weight is the figure airlines and air forwarders use to calculate the freight charge. It is whichever is greater between gross scale weight and volumetric weight.',
      },
    ],
  },
  {
    slug: 'lcl-freight-calculator',
    path: '/lcl-freight-calculator/',
    title: 'LCL Freight Calculator',
    h1: 'LCL Freight Calculator (Weight or Measure / W/M)',
    metaTitle: 'LCL Freight Calculator — Weight or Measure (W/M) Revenue Tons — FreightPlanHQ',
    metaDescription:
      'Calculate ocean LCL freight chargeable volume using the Weight or Measure (W/M) revenue ton principle. Compare CBM vs metric tonnes.',
    category: 'Air & Ocean',
    shortDesc: 'Calculate ocean LCL chargeable volume using the Weight or Measure (W/M) revenue ton principle.',
    spec: lclFreightSpec,
    formula: {
      summary: 'Revenue Ton (RT) = max(Shipment CBM, Metric Tonnes). Base Freight = RT × Ocean Freight Rate.',
      latexOrCode: 'W/M = max(Volume in CBM, Weight in MT)',
      variables: [
        { symbol: 'CBM', explanation: 'Cubic meters of cargo' },
        { symbol: 'Metric Tonnes', explanation: 'Weight in kg ÷ 1,000' },
        { symbol: 'Revenue Ton (RT)', explanation: 'The greater of CBM or metric tonnes' },
      ],
    },
    workedExample: {
      title: 'Ocean LCL Palletized Cargo',
      scenario: '4 pallets totaling 5.2 CBM weighing 2,800 kg. Ocean freight rate quoted at $85 per W/M.',
      inputs: [
        { label: 'Shipment Volume', value: '5.20 CBM' },
        { label: 'Shipment Weight', value: '2,800 kg (2.80 metric tonnes)' },
        { label: 'Freight Rate', value: '$85.00 per RT' },
      ],
      steps: [
        'Convert weight to tonnes: 2,800 kg ÷ 1,000 = 2.80 MT.',
        'Compare Volume (5.20 CBM) vs Weight (2.80 MT): 5.20 > 2.80.',
        'Billable W/M basis: 5.20 Revenue Tons (Volume basis).',
        'Base freight cost: 5.20 RT × $85.00 = $442.00.',
      ],
      result: {
        label: 'Chargeable W/M (Revenue Tons)',
        value: '5.20 RT',
        note: 'Base freight: $442.00 (volume exceeded weight).',
      },
    },
    assumptions: [
      'Standard ocean ratio: 1 CBM = 1 metric ton (1,000 kg).',
      'Does not assume origin/destination THC, BAF, CAF, or documentation fees unless entered.',
    ],
    limitations: [
      'This is a planning estimate. Forwarders apply minimum revenue tons (often 1 or 2 RT) and port surcharges.',
    ],
    disclaimer:
      'This is a planning estimate and does not include carrier-specific fees, BAF, CAF, THC, or local port charges.',
    sourceIds: ['lcl-wm'],
    relatedCalculators: ['cbm-calculator', 'container-loading-calculator'],
    relatedGuides: ['lcl-weight-or-measure', 'what-is-cbm'],
    faqs: [
      {
        question: 'What does W/M mean in ocean shipping?',
        answer: 'W/M stands for Weight or Measure. Ocean carriers rate LCL shipments per Revenue Ton (RT), charging based on whichever number is larger: cubic meters (measure) or metric tonnes (weight).',
      },
      {
        question: 'Why are destination charges so high on LCL freight?',
        answer: 'LCL freight involves container de-consolidation, warehouse handling, and port documentation at the destination CFS (Container Freight Station). These fixed port handling charges are billed separately from base ocean freight.',
      },
    ],
  },
  {
    slug: 'pallets-per-container-calculator',
    path: '/pallets-per-container-calculator/',
    title: 'Pallets Per Container Calculator',
    h1: 'Pallets Per Container Calculator (2D Floor Layout)',
    metaTitle: 'Pallets Per Container Calculator — 20ft & 40ft Floor Packing — FreightPlanHQ',
    metaDescription:
      'Calculate how many standard Euro and GMA pallets fit on the floor of 20ft and 40ft shipping containers with orientation and clearance optimization.',
    category: 'Containers & Trailers',
    shortDesc: 'Calculate how many standard Euro or GMA pallets fit on the floor of 20ft and 40ft containers.',
    spec: palletsPerContainerSpec,
    formula: {
      summary: '2D rectangular floor packing heuristic evaluating aligned and turned (90°) pallet rows within container internal dimensions.',
      latexOrCode: 'Floor Utilization = (Pallet Footprints) / Container Floor Area',
      variables: [
        { symbol: 'Pallets on Floor', explanation: 'Total pallets placed without overlap on the container deck' },
        { symbol: 'Floor Util %', explanation: 'Area of pallets divided by container interior floor area' },
      ],
    },
    workedExample: {
      title: 'Euro Pallets in a 20ft Dry Container',
      scenario: 'Loading standard EUR / EPAL pallets (1200 × 800 mm) into a standard 20ft container (5896 × 2350 mm floor).',
      inputs: [
        { label: 'Pallet Size', value: '1200 × 800 mm (Euro pallet)' },
        { label: 'Container', value: '20 ft standard (5896 × 2350 mm floor)' },
      ],
      steps: [
        'Turned orientation (800 mm along length, 1200 mm across width): fits 1 pallet across width (1200 mm) or mixed combinations.',
        'Best evaluated packing places 11 Euro pallets on the floor of a 20ft container.',
        'Floor area utilization: (11 × 0.96 m²) ÷ (5.896 × 2.35 m) = 76.2%.',
      ],
      result: {
        label: 'Pallets on Floor',
        value: '11 Euro Pallets',
        note: 'Floor utilization: ~76.2% across 20ft container floor.',
      },
    },
    assumptions: [
      'Pallets are packed on a single tier (floor level) unless double-stacking is explicitly evaluated.',
      'Container floor dimensions match ISO standard internal clearances.',
    ],
    limitations: [
      'Assumes pallets have zero overhang. Overhanging freight will reduce the number of pallets that fit.',
    ],
    disclaimer:
      'Actual pallet fit depends on pallet squareness, stretch wrap bulges, and container door sill clearance.',
    sourceIds: ['container-line-specs', 'iso-6780', 'epal-euro-pallet'],
    relatedCalculators: ['pallet-calculator', 'container-loading-calculator'],
    relatedGuides: ['shipping-container-dimensions', 'standard-pallet-sizes', '20ft-container-dimensions'],
    faqs: [
      {
        question: 'How many standard pallets fit in a 20ft container?',
        answer: 'A 20ft container typically holds 10 standard North American GMA pallets (48 × 40 in) or 11 Euro pallets (1200 × 800 mm) on the floor.',
      },
      {
        question: 'How many pallets fit in a 40ft container?',
        answer: 'A standard 40ft container typically holds 20–21 GMA pallets (48 × 40 in) or 24–25 Euro pallets (1200 × 800 mm) on a single floor tier.',
      },
    ],
  },
  {
    slug: 'loading-meter-calculator',
    path: '/loading-meter-calculator/',
    title: 'Loading Meter Calculator',
    h1: 'Loading Meter Calculator (LDM European Road Freight)',
    metaTitle: 'Loading Meter Calculator (LDM) — European Road Freight — FreightPlanHQ',
    metaDescription:
      'Calculate loading meters (LDM) for European road freight trailer planning. Supports Euro pallets, industrial pallets, custom dimensions, and stackability.',
    category: 'Containers & Trailers',
    shortDesc: 'Calculate European road freight loading meters (LDM) and trailer floor space utilization.',
    spec: loadingMeterSpec,
    formula: {
      summary: '1 LDM = 1 meter of trailer length across standard 2.4 m trailer width. LDM = (Length × Width) ÷ 2.4 m.',
      latexOrCode: 'LDM = (Cargo Floor Length * Cargo Width) / 2.40 m',
      variables: [
        { symbol: 'LDM', explanation: 'Lademeter: floor length in meters occupied on a standard trailer' },
        { symbol: 'Trailer Width', explanation: 'Standard European trailer width (typically 2.40 m)' },
      ],
    },
    workedExample: {
      title: 'Euro Pallet LDM Calculation',
      scenario: 'Shipping 10 non-stackable Euro pallets (1.2 × 0.8 m) on a standard 2.4 m wide trailer.',
      inputs: [
        { label: 'Pallet Size', value: '1.2 × 0.8 m (Euro pallet)' },
        { label: 'Quantity', value: '10 pallets' },
        { label: 'Trailer Width', value: '2.40 m' },
      ],
      steps: [
        'One Euro pallet area: 1.2 m × 0.8 m = 0.96 m².',
        'Theoretical LDM per pallet: 0.96 m² ÷ 2.4 m = 0.40 LDM.',
        'When loaded 2 abreast across trailer width: 2 pallets occupy 0.80 m of trailer length = 0.80 LDM (0.40 LDM each).',
        '10 pallets arranged 2 abreast: 5 rows × 0.80 m = 4.00 LDM total.',
      ],
      result: {
        label: 'Loading Metres',
        value: '4.00 LDM',
        note: '10 floor positions across 5 rows in a 2.4 m wide trailer.',
      },
    },
    assumptions: [
      'Standard trailer usable width is 2.40 m (240 cm). Standard trailer length is 13.6 m (33 Euro pallet capacity).',
      'Assumes items are loaded efficiently along trailer longitudinal axis.',
    ],
    limitations: [
      'Loading meters is a European road freight planning convention. Consolidators enforce minimum LDM ratings.',
    ],
    disclaimer:
      'Loading meter formulas are planning references. Freight forwarders establish their own commercial tariffs.',
    sourceIds: ['ldm-convention', 'epal-euro-pallet'],
    relatedCalculators: ['linear-feet-calculator', 'pallet-calculator'],
    relatedGuides: ['standard-pallet-sizes'],
    faqs: [
      {
        question: 'What is a loading meter (LDM)?',
        answer: 'A loading meter (Lademeter in German) represents one linear meter of cargo space along the length of a standard European truck trailer (which has an interior width of 2.4 meters).',
      },
      {
        question: 'How many LDM is a Euro pallet?',
        answer: 'A standard Euro pallet (1200 × 800 mm) equals 0.4 LDM. Two Euro pallets placed side-by-side equal 0.8 LDM.',
      },
      {
        question: 'How many LDM is a full European truckload?',
        answer: 'A standard full European semi-trailer (curtainsider or box trailer) is 13.6 meters long, providing 13.6 LDM of floor space (equivalent to 33 Euro pallets or 26 industrial pallets).',
      },
    ],
  },
  {
    slug: 'linear-feet-calculator',
    path: '/linear-feet-calculator/',
    title: 'Linear Feet Calculator',
    h1: 'Linear Feet Calculator (U.S. / Canada LTL Trailer Space)',
    metaTitle: 'Linear Feet Calculator — LTL Trailer Floor Space — FreightPlanHQ',
    metaDescription:
      'Calculate linear feet of trailer space occupied by LTL freight. Plan trailer floor space across 48x40 pallets and avoid capacity surcharges.',
    category: 'Containers & Trailers',
    shortDesc: 'Calculate trailer floor length in linear feet occupied by North American LTL freight.',
    spec: linearFeetSpec,
    formula: {
      summary: 'Linear Feet = Total length of trailer floor occupied from front to back, considering items side-by-side across trailer width.',
      latexOrCode: 'Linear Feet = Trailer Floor Length Occupied (in inches) / 12',
      variables: [
        { symbol: 'Linear Feet', explanation: 'Trailer floor length in feet occupied by shipment' },
        { symbol: 'Usable Width', explanation: 'Internal trailer width (typically 96 to 102 inches)' },
      ],
    },
    workedExample: {
      title: '12 Standard GMA Pallets on a 53ft Trailer',
      scenario: 'Shipping 12 non-stackable 48 × 40 in pallets on a standard 53ft dry van (96 in usable interior width).',
      inputs: [
        { label: 'Pallet Size', value: '48 × 40 in' },
        { label: 'Quantity', value: '12 pallets (non-stackable)' },
        { label: 'Trailer Width', value: '96 in' },
      ],
      steps: [
        'Pallets loaded turned side-by-side (pinwheeled or straight): 2 pallets of 48 in width fit across 96 in trailer width.',
        'Each row of 2 pallets occupies 40 in of trailer length.',
        '12 pallets require 6 rows: 6 × 40 in = 240 inches of trailer length.',
        'Convert to feet: 240 in ÷ 12 = 20.0 linear feet.',
      ],
      result: {
        label: 'Trailer Floor Space',
        value: '20.0 Linear Feet',
        note: '6 rows of 2 pallets on a 96 in wide floor.',
      },
    },
    assumptions: [
      'Assumes items are loaded on the trailer deck utilizing available width before extending lengthwise.',
      'Standard dry van trailer width modeled as 96 in interior usable space.',
    ],
    limitations: [
      'Carriers enforce proprietary linear foot rule thresholds (commonly spot-quoted when freight exceeds 12 to 20 linear feet).',
    ],
    disclaimer:
      'Carrier linear foot thresholds, cubic capacity rules, and pricing penalties vary by carrier tariff.',
    sourceIds: ['linear-feet-convention'],
    relatedCalculators: ['loading-meter-calculator', 'pallet-calculator'],
    relatedGuides: ['ltl-linear-feet-explained', 'standard-pallet-sizes', 'how-to-measure-freight'],
    faqs: [
      {
        question: 'What is the LTL linear foot rule?',
        answer: 'Many North American LTL carriers enforce a linear foot rule (often 12 to 20 feet) where shipments exceeding that length are deemed capacity-consuming and subject to higher truckload spot rates or minimum charge floors.',
      },
      {
        question: 'How many pallets fit in a 53-foot trailer?',
        answer: 'A standard 53ft dry van trailer accommodates 26 standard 48 × 40 inch pallets straight loaded or up to 30 pinwheeled on a single tier.',
      },
    ],
  },
  {
    slug: 'package-girth-calculator',
    path: '/package-girth-calculator/',
    title: 'Package Girth Calculator',
    h1: 'Package Girth Calculator (Length + Girth)',
    metaTitle: 'Package Girth Calculator — Length Plus Girth Surcharges — FreightPlanHQ',
    metaDescription:
      'Calculate package girth and Length + Girth for shipping. Check carrier thresholds (108", 130", 165") and avoid oversize parcel surcharges.',
    category: 'Packaging',
    shortDesc: 'Calculate package girth and combined Length + Girth against carrier parcel thresholds.',
    spec: packageGirthSpec,
    formula: {
      summary: 'Girth = 2 × (Width + Height). Length + Girth = Longest Dimension + 2 × (Width + Height).',
      latexOrCode: 'Length + Girth = Length + 2 * (Width + Height)',
      variables: [
        { symbol: 'Length', explanation: 'Longest side of the box' },
        { symbol: 'Girth', explanation: 'Perimeter around the cross-section perpendicular to length' },
      ],
    },
    workedExample: {
      title: 'Oversize Parcel Surcharge Check',
      scenario: 'A carton measures 42 × 28 × 22 inches.',
      inputs: [
        { label: 'Carton Dimensions', value: '42 × 28 × 22 inches' },
        { label: 'Carrier Limit', value: '130 inches (Large Package threshold)' },
      ],
      steps: [
        'Identify longest side (Length): 42 inches.',
        'Calculate girth: 2 × (28 + 22) = 2 × 50 = 100 inches.',
        'Calculate Length + Girth: 42 + 100 = 142 inches.',
        'Compare against 130 inch limit: 142 > 130 inches (exceeds limit by 12 inches).',
      ],
      result: {
        label: 'Length + Girth',
        value: '142.0 in',
        note: 'Exceeds 130" threshold by 12.0 inches (Large Package Surcharge applies).',
      },
    },
    assumptions: [
      'Length is automatically identified as the longest physical dimension.',
      'Girth measures distance around the perimeter of the other two dimensions.',
    ],
    limitations: [
      'Carriers often round up fractional dimensions to the nearest whole inch before calculating girth.',
    ],
    disclaimer:
      'Carrier oversize thresholds and surcharge amounts vary. Confirm with your parcel carrier tariff.',
    sourceIds: ['parcel-dim-us', 'fedex-ups-rounding'],
    relatedCalculators: ['dimensional-weight-calculator', 'box-size-calculator'],
    relatedGuides: ['dimensional-weight-formula', 'how-to-measure-freight'],
    faqs: [
      {
        question: 'How do you measure girth for shipping?',
        answer: 'Identify the longest side as Length. For the remaining two sides (Width and Height), add them together and multiply by 2: Girth = 2 × (Width + Height).',
      },
      {
        question: 'What is the maximum Length + Girth allowed by UPS and FedEx?',
        answer: 'Standard maximum size is 165 inches in Length + Girth combined. Packages between 130 and 165 inches incur Large Package or Oversize surcharges, while packages over 165 inches are typically rejected from small-package networks.',
      },
    ],
  },
  {
    slug: 'box-size-calculator',
    path: '/box-size-calculator/',
    title: 'Box Size Calculator',
    h1: 'Box Size Calculator (Optimal Shipping Carton Sizing)',
    metaTitle: 'Box Size Calculator — Right-Size Packaging & Void Reduction — FreightPlanHQ',
    metaDescription:
      'Calculate recommended internal and external shipping box dimensions for single or multi-unit products with padding, clearance, and wall thickness.',
    category: 'Packaging',
    shortDesc: 'Calculate recommended internal and external box dimensions for products with padding and clearance.',
    spec: boxSizeSpec,
    formula: {
      summary: 'Internal Dims = (Grid Units × Product Size) + (2 × Padding) + Divider Clearance. Outside Dims = Internal Dims + (2 × Board Thickness).',
      latexOrCode: 'Inner = (nx * L) + 2*Pad; Outer = Inner + 2*Board',
      variables: [
        { symbol: 'Padding', explanation: 'Protective clearance on each wall (e.g. bubble wrap)' },
        { symbol: 'Grid (nx, ny, nz)', explanation: 'Optimal 3D product arrangement factors' },
        { symbol: 'Board Thickness', explanation: 'Corrugated caliper (single or double wall)' },
      ],
    },
    workedExample: {
      title: 'Carton Sizing for 6 Product Units',
      scenario: 'Packing 6 retail items measuring 20 × 15 × 10 cm each into a master shipping box with 1.5 cm padding per side and 0.4 cm board thickness.',
      inputs: [
        { label: 'Item Size', value: '20 × 15 × 10 cm' },
        { label: 'Units to Pack', value: '6 units' },
        { label: 'Padding', value: '1.5 cm per side' },
        { label: 'Board Caliper', value: '0.4 cm' },
      ],
      steps: [
        'Optimal grid evaluated: 2 units in X, 3 units in Y, 1 unit in Z (or 1×2×3).',
        'Raw product grid: (2 × 20) = 40 cm; (3 × 15) = 45 cm; (1 × 10) = 10 cm.',
        'Add padding (2 × 1.5 cm = 3 cm): Inside L = 43.0 cm, Inside W = 48.0 cm, Inside H = 13.0 cm.',
        'Add board thickness (2 × 0.4 cm = 0.8 cm): Outside L = 43.8 cm, Outside W = 48.8 cm, Outside H = 13.8 cm.',
      ],
      result: {
        label: 'Recommended Box Dimensions',
        value: 'Inside: 43.0 × 48.0 × 13.0 cm',
        note: 'Outside: 43.8 × 48.8 × 13.8 cm (Cube utilization: ~57.7%).',
      },
    },
    assumptions: [
      'Evaluates rectangular grid packing configurations for identical rectangular items.',
      'Padding is applied equally to all exterior faces of the product cluster.',
    ],
    limitations: [
      'Represents a geometric planning model; does not replace structural corrugated drop testing or ASTM D4169 vibration standards.',
    ],
    disclaimer:
      'Recommended box dimensions are planning models. Standard commercial box catalog sizes should be used where available.',
    sourceIds: ['parcel-dim-us'],
    relatedCalculators: ['box-volume-calculator', 'dimensional-weight-calculator', 'pallet-calculator'],
    relatedGuides: ['right-size-packaging-for-dimensional-weight', 'how-to-measure-freight'],
    faqs: [
      {
        question: 'How much clearance should I add around a product when choosing a box?',
        answer: 'For standard non-fragile consumer goods, 1 to 2 inches (2.5 to 5 cm) of cushioning material (such as bubble wrap or kraft paper) is recommended between the product and all inner box walls.',
      },
      {
        question: 'What is the difference between inside and outside box dimensions?',
        answer: 'Inside dimensions define usable volume and determine whether products fit. Outside dimensions are used by shipping carriers to calculate dimensional weight and shipping volume.',
      },
    ],
  },
  {
    slug: 'box-volume-calculator',
    path: '/box-volume-calculator/',
    title: 'Box Volume Calculator',
    h1: 'Box Volume Calculator (Litres, m³, ft³, and in³)',
    metaTitle: 'Box Volume Calculator — Litres, Cubic Meters & Cubic Feet — FreightPlanHQ',
    metaDescription:
      'Calculate box volume instantly across cubic centimeters, liters, cubic meters, cubic inches, and cubic feet. Fast, focused carton volume tool.',
    category: 'Packaging',
    shortDesc: 'Convert and calculate carton volume in litres, cubic meters, cubic feet, and cubic inches.',
    spec: boxVolumeSpec,
    formula: {
      summary: 'Volume = Length × Width × Height. Automatically converts to mm³, cm³, litres, m³, in³, and ft³.',
      latexOrCode: 'Volume = Length * Width * Height',
      variables: [
        { symbol: 'L, W, H', explanation: 'Box dimensions' },
        { symbol: 'Volume', explanation: 'Total cubic displacement' },
      ],
    },
    workedExample: {
      title: 'Carton Volume Conversion',
      scenario: 'A carton measuring 60 × 40 × 40 cm.',
      inputs: [{ label: 'Carton Dimensions', value: '60 × 40 × 40 cm' }],
      steps: [
        'Calculate cubic centimeters: 60 × 40 × 40 = 96,000 cm³.',
        'Convert to litres: 96,000 ÷ 1,000 = 96.0 litres.',
        'Convert to cubic meters: 96,000 ÷ 1,000,000 = 0.096 m³.',
        'Convert to cubic feet: 0.096 × 35.3147 = 3.390 ft³.',
      ],
      result: {
        label: 'Box Volume',
        value: '96.0 Litres (0.096 m³ / 3.39 ft³)',
        note: 'Complete multi-unit conversion.',
      },
    },
    assumptions: ['Assumes rectangular cuboid box geometry.'],
    limitations: ['Does not evaluate shipping density or dimensional weight divisors.'],
    disclaimer: 'Calculates pure geometric volume of a rectangular box.',
    sourceIds: ['lcl-wm'],
    relatedCalculators: ['cbm-calculator', 'box-size-calculator', 'dimensional-weight-calculator'],
    relatedGuides: ['what-is-cbm', 'how-to-calculate-cbm'],
    faqs: [
      {
        question: 'How do you calculate box volume in litres?',
        answer: 'Measure Length, Width, and Height in centimeters, multiply them together, and divide by 1,000. For example, 50 × 40 × 30 cm = 60,000 cm³ ÷ 1,000 = 60 litres.',
      },
      {
        question: 'How many cubic feet are in a cubic meter?',
        answer: 'One cubic meter equals approximately 35.3147 cubic feet.',
      },
    ],
  },
];

export const getCalculatorBySlug = (slug: string): CalculatorMeta | undefined =>
  calculators.find((c) => c.slug === slug);
