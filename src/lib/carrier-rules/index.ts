import type { DimRule } from '../calculations/dimensional-weight';

/**
 * Generic carrier / service rule registry. Rules are DATA, not logic.
 * `effectiveDate` is only set when a date was reported by a source; otherwise null.
 */
export interface ServiceRule {
  id: string;
  service: string;
  region: string;
  ruleType: 'dim-divisor' | 'rounding' | 'threshold';
  parameter: string;
  value: number | string;
  unit: string;
  effectiveDate: string | null;
  source: string;
  verified: string;
  notes: string;
  limitations: string;
}

export const serviceRules: ServiceRule[] = [
  {
    id: 'ups-daily',
    service: 'UPS U.S. Domestic Daily Rates (Commercial / Scheduled Pickup)',
    region: 'United States',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 139,
    unit: 'in³ per lb',
    effectiveDate: '2026-01',
    source: 'ups-tariff-limits',
    verified: '2026-10-09',
    notes: 'Published standard divisor for UPS Daily Rates on domestic U.S. packages. Billed per package with whole-pound rounding.',
    limitations: 'Does not apply to Retail Rates at The UPS Store or negotiated enterprise contracts with custom divisors.',
  },
  {
    id: 'ups-retail',
    service: 'UPS U.S. Domestic Retail Rates (The UPS Store & Customer Centers)',
    region: 'United States',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 166,
    unit: 'in³ per lb',
    effectiveDate: '2026-01',
    source: 'ups-tariff-limits',
    verified: '2026-10-09',
    notes: 'Published standard divisor for UPS Retail Rates across retail counters and The UPS Store.',
    limitations: 'Applies specifically to retail counter transactions; not daily pickup commercial accounts.',
  },
  {
    id: 'fedex-domestic',
    service: 'FedEx U.S. Domestic Express & Ground Standard Commercial',
    region: 'United States',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 139,
    unit: 'in³ per lb',
    effectiveDate: '2026-01',
    source: 'fedex-dim-guidance',
    verified: '2026-10-10',
    notes: 'Published standard divisor for FedEx Express and Ground domestic shipments. Dimensions rounded to the nearest whole inch per FedEx packaging guidance; whole-pound weight rounding.',
    limitations: 'Negotiated commercial accounts frequently obtain custom divisors (e.g. 166 or 194).',
  },
  {
    id: 'usps-retail-priority',
    service: 'USPS Retail Priority Mail (DMM 123.1.3)',
    region: 'United States',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 139,
    unit: 'in³ per lb',
    effectiveDate: '2026-01',
    source: 'usps-dmm-standards',
    verified: '2026-10-10',
    notes: 'Applies to qualifying low-density parcels addressed to Zones 1–9 exceeding 1,728 cubic inches (1 cu ft). Divisor is 139 for both rectangular and nonrectangular parcels (0.785 factor for nonrectangular). Round each dimension up to next whole inch (DMM 123.1.3.2 & 123.1.3.3). Dimensional weights exceeding 70 lb are billed at the 70-lb price.',
    limitations: 'Parcels 1,728 in³ or less are rated on actual weight. Does not apply to Priority Mail Flat Rate packaging.',
  },
  {
    id: 'usps-commercial-priority',
    service: 'USPS Commercial Priority Mail (DMM 223.1.4)',
    region: 'United States',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: '139 (rectangular) / 166 (nonrectangular)',
    unit: 'in³ per lb',
    effectiveDate: '2026-01',
    source: 'usps-dmm-standards',
    verified: '2026-10-10',
    notes: 'Applies to Commercial Priority Mail parcels addressed to Zones 1–9 exceeding 1,728 cubic inches. Divisor is 139 for rectangular parcels, and 166 for nonrectangular parcels (with 0.785 adjustment factor). Rectangular dimensions round up to next whole inch (DMM 223.1.4.2); nonrectangular dimensions round off to nearest whole inch (DMM 223.1.4.3). Dimensional weights exceeding 70 lb are billed at the 70-lb price.',
    limitations: 'Parcels 1,728 in³ or less are rated on actual weight. Does not apply to Priority Mail Flat Rate packaging.',
  },
  {
    id: 'usps-priority-express',
    service: 'USPS Priority Mail Express Retail & Commercial (DMM 113.1.3 & 213.1.4)',
    region: 'United States',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 139,
    unit: 'in³ per lb',
    effectiveDate: '2026-01',
    source: 'usps-dmm-standards',
    verified: '2026-10-10',
    notes: 'Qualifying parcels addressed to Zones 1–9 exceeding 1,728 cubic inches use 139 in³/lb divisor for both rectangular and nonrectangular parcels (0.785 factor for nonrectangular). Round each dimension up to next whole inch (DMM 113.1.3.2 / 113.1.3.3 & 213.1.4.2 / 213.1.4.3). Pieces up to 0.5 lb pay the 0.5-lb rate; weights over 0.5 lb round up to whole pounds up to the 70-lb cap.',
    limitations: 'Parcels 1,728 in³ or less are rated on actual weight.',
  },
  {
    id: 'courier-metric-5000',
    service: 'International Express Courier Metric (DHL, FedEx, UPS International)',
    region: 'International',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 5000,
    unit: 'cm³ per kg',
    effectiveDate: null,
    source: 'parcel-dim-us',
    verified: '2026-10-09',
    notes: 'Standard published metric divisor across international express courier networks.',
    limitations: 'Country tariffs and customer agreements may define alternative rules.',
  },
  {
    id: 'air-6000',
    service: 'General air cargo planning (IATA TACT Rule 3.9.4)',
    region: 'International air freight',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 6000,
    unit: 'cm³ per kg',
    effectiveDate: null,
    source: 'iata-volumetric',
    verified: '2026-10-09',
    notes: 'Commonly referenced general air cargo volumetric convention (1 cbm = 166.67 kg). Evaluated at shipment level.',
    limitations: 'Airlines and forwarders set their own tariff divisor, weight steps, and rounding rules.',
  },
];

export interface DimPreset {
  id: string;
  label: string;
  rule: DimRule;
  ruleId: string;
  source: string;
  verified: string;
  applicability: string;
  limitation: string;
}

/** Dimensional weight presets (parcel/courier). */
export const dimPresets: DimPreset[] = [
  {
    id: 'ups-daily',
    label: '139 in³/lb — UPS U.S. Daily Rates (Commercial / Scheduled Pickup)',
    rule: { divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', dimensionRounding: 'up', roundDimensionsUp: true, basis: 'piece', weightRounding: 'whole' },
    ruleId: 'ups-daily',
    source: 'ups-tariff-limits',
    verified: '2026-10-10',
    applicability: 'UPS domestic package services under Daily Rates (scheduled pickup and UPS.com commercial accounts). Fractional dimensions rounded up to next whole inch; evaluated per package with whole-pound rounding.',
    limitation: 'Retail counter customers (The UPS Store) and negotiated enterprise accounts with custom divisors differ.',
  },
  {
    id: 'ups-retail',
    label: '166 in³/lb — UPS U.S. Retail Rates (The UPS Store & Customer Counters)',
    rule: { divisor: 166, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', dimensionRounding: 'up', roundDimensionsUp: true, basis: 'piece', weightRounding: 'whole' },
    ruleId: 'ups-retail',
    source: 'ups-tariff-limits',
    verified: '2026-10-10',
    applicability: 'UPS Retail Rates applied at The UPS Store and retail customer counters for domestic packages. Fractional dimensions rounded up to next whole inch; whole-pound rounding per package.',
    limitation: 'Does not apply to Daily pickup accounts or commercial shipping accounts using 139.',
  },
  {
    id: 'fedex-domestic',
    label: '139 in³/lb — FedEx U.S. Domestic (Express & Ground Standard)',
    rule: { divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', dimensionRounding: 'nearest', roundDimensionsUp: false, basis: 'piece', weightRounding: 'whole' },
    ruleId: 'fedex-domestic',
    source: 'fedex-dim-guidance',
    verified: '2026-10-10',
    applicability: 'FedEx Express and FedEx Ground U.S. domestic package tariffs. Dimensions rounded to the nearest whole inch per FedEx packaging guidance; whole-pound rounding per piece.',
    limitation: 'Negotiated volume contracts and retail counter pricing tiers may specify custom divisors (e.g. 166).',
  },
  {
    id: 'usps-commercial-priority',
    label: '139 / 166 in³/lb — USPS Commercial Priority Mail (> 1 cu ft, Zones 1–9)',
    rule: {
      divisor: 139,
      nonrectangularDivisor: 166,
      nonrectangularFactor: 0.785,
      minVolumeThreshold: 1728,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      nonrectangularDimensionRounding: 'nearest',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'whole',
      maxRatedWeight: 70,
      maxScaleWeight: 70,
    },
    ruleId: 'usps-commercial-priority',
    source: 'usps-dmm-standards',
    verified: '2026-10-10',
    applicability: 'USPS Commercial Priority Mail parcels exceeding 1,728 in³ (1 cu ft) addressed to Zones 1–9 (DMM 223.1.4). Divisor is 139 for rectangular parcels, and 166 for nonrectangular parcels (with 0.785 adjustment factor). Rectangular dimensions round up to next whole inch (DMM 223.1.4.2); nonrectangular dimensions round off to nearest whole inch (DMM 223.1.4.3). Dimensional weights exceeding 70 lb are billed at the 70-lb price.',
    limitation: 'Parcels measuring 1,728 in³ or less are rated on actual weight. Does not apply to Priority Mail Flat Rate packaging or Ground Advantage.',
  },
  {
    id: 'usps-retail-priority',
    label: '139 in³/lb — USPS Retail Priority Mail (> 1 cu ft, Zones 1–9)',
    rule: {
      divisor: 139,
      nonrectangularDivisor: 139,
      nonrectangularFactor: 0.785,
      minVolumeThreshold: 1728,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      nonrectangularDimensionRounding: 'up',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'whole',
      maxRatedWeight: 70,
      maxScaleWeight: 70,
    },
    ruleId: 'usps-retail-priority',
    source: 'usps-dmm-standards',
    verified: '2026-10-10',
    applicability: 'USPS Retail Priority Mail parcels exceeding 1,728 in³ (1 cu ft) addressed to Zones 1–9 (DMM 123.1.3). Divisor is 139 for both rectangular and nonrectangular parcels (0.785 factor for nonrectangular). Round each dimension up to next whole inch (DMM 123.1.3.2 & 123.1.3.3). Dimensional weights exceeding 70 lb are billed at the 70-lb price.',
    limitation: 'Parcels measuring 1,728 in³ or less are rated on actual weight. Does not apply to Flat Rate envelopes or boxes.',
  },
  {
    id: 'usps-priority-express',
    label: '139 in³/lb — USPS Priority Mail Express (Retail & Commercial, > 1 cu ft)',
    rule: {
      divisor: 139,
      nonrectangularDivisor: 139,
      nonrectangularFactor: 0.785,
      minVolumeThreshold: 1728,
      divisorLengthUnit: 'in',
      divisorWeightUnit: 'lb',
      dimensionRounding: 'up',
      nonrectangularDimensionRounding: 'up',
      roundDimensionsUp: true,
      basis: 'piece',
      weightRounding: 'half-then-whole',
      maxRatedWeight: 70,
      maxScaleWeight: 70,
    },
    ruleId: 'usps-priority-express',
    source: 'usps-dmm-standards',
    verified: '2026-10-10',
    applicability: 'USPS Retail (DMM 113.1.3) and Commercial (DMM 213.1.4) Priority Mail Express parcels exceeding 1,728 in³ to Zones 1–9. Both use 139 divisor with 0.785 nonrectangular factor. Round each dimension up to next whole inch. Pieces up to 0.5 lb pay the 0.5-lb rate; weights over 0.5 lb round up to whole pounds up to the 70-lb cap.',
    limitation: 'Parcels measuring 1,728 in³ or less are rated on actual weight (with 0.5 lb minimum increment). Dimensional weights exceeding 70 lb are billed at the 70-lb price.',
  },
  {
    id: 'courier-metric-5000',
    label: '5,000 cm³/kg — DHL Express & International Courier Metric',
    rule: { divisor: 5000, divisorLengthUnit: 'cm', divisorWeightUnit: 'kg', roundDimensionsUp: false, basis: 'piece', weightRounding: 'none' },
    ruleId: 'courier-metric-5000',
    source: 'parcel-dim-us',
    verified: '2026-10-09',
    applicability: 'International courier services (DHL Express, FedEx Express International, UPS International) using metric centimeters and kilograms.',
    limitation: 'Specific service tariffs and negotiated contracts differ. Confirm with your carrier schedule.',
  },
];

// Compatibility aliases for legacy IDs
const legacyAliases: Record<string, string> = {
  'parcel-139': 'ups-daily',
  'parcel-166': 'ups-retail',
  'parcel-5000': 'courier-metric-5000',
};

/** Air freight presets: shipment-level by default for general cargo. */
export const airPresets: DimPreset[] = [
  {
    id: 'air-6000',
    label: '6,000 cm³/kg (IATA general air cargo TACT Rule 3.9.4 planning reference)',
    rule: { divisor: 6000, divisorLengthUnit: 'cm', divisorWeightUnit: 'kg', roundDimensionsUp: false, basis: 'shipment', weightRounding: 'half' },
    ruleId: 'air-6000',
    source: 'iata-volumetric',
    verified: '2026-10-09',
    applicability: 'General international air cargo booked through commercial airlines and IATA freight forwarders (1 cbm = 166.67 kg). Calculated for the entire shipment.',
    limitation: 'Not universal. Express air services, domestic air cargo, and specific airline tariffs may use 5,000 or custom divisors. Rounding up to 0.5 kg increments is typical but subject to carrier tariff.',
  },
  {
    id: 'air-5000',
    label: '5,000 cm³/kg (International express courier air reference)',
    rule: { divisor: 5000, divisorLengthUnit: 'cm', divisorWeightUnit: 'kg', roundDimensionsUp: false, basis: 'piece', weightRounding: 'half' },
    ruleId: 'air-5000',
    source: 'iata-volumetric',
    verified: '2026-10-09',
    applicability: 'Express courier air shipments (e.g. DHL Express, FedEx Priority, UPS Worldwide Express) evaluated per individual piece.',
    limitation: 'Do not apply courier express divisors to standard airline freight bookings unless instructed by your forwarder.',
  },
];

export const dimPresetById = (id: string): DimPreset | undefined => {
  const resolvedId = legacyAliases[id] || id;
  return dimPresets.find((p) => p.id === resolvedId);
};

export const airPresetById = (id: string): DimPreset | undefined => airPresets.find((p) => p.id === id);
