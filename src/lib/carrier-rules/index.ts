import type { DimRule } from '../calculations/dimensional-weight';

/**
 * Generic carrier / service rule registry. Rules are DATA, not logic.
 * `effectiveDate` is only set when a date was reported by a source; otherwise null.
 */
export interface ServiceRule {
  id: string;
  service: string;
  region: string;
  ruleType: 'dim-divisor' | 'rounding';
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
    id: 'parcel-139',
    service: 'Standard U.S. parcel rates (reference)',
    region: 'Parcel/courier',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 139,
    unit: 'in³ per lb',
    effectiveDate: null,
    source: 'parcel-dim-us',
    verified: '2026-10-06',
    notes: 'Commonly published standard divisor for inch/pound shipments.',
    limitations: 'Contract, retail and international services can use other divisors.',
  },
  {
    id: 'parcel-5000',
    service: 'Metric parcel/courier rates (reference)',
    region: 'Parcel/courier',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 5000,
    unit: 'cm³ per kg',
    effectiveDate: null,
    source: 'parcel-dim-us',
    verified: '2026-10-06',
    notes: 'Commonly published metric divisor for courier services.',
    limitations: 'Services differ. Confirm with your carrier.',
  },
  {
    id: 'parcel-166',
    service: 'Alternate inch/pound divisor (reference)',
    region: 'Parcel/courier',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 166,
    unit: 'in³ per lb',
    effectiveDate: null,
    source: 'parcel-dim-us',
    verified: '2026-10-06',
    notes: 'A divisor of 166 is commonly cited for some retail or postal-style services.',
    limitations: 'Applies only to services that publish it. Check the specific service.',
  },
  {
    id: 'parcel-round-up',
    service: 'Whole-inch dimension rounding (reference)',
    region: 'Parcel/courier',
    ruleType: 'rounding',
    parameter: 'round each dimension up',
    value: 'next whole inch',
    unit: 'inch',
    effectiveDate: '2025-08 (reported)',
    source: 'fedex-ups-rounding',
    verified: '2026-10-06',
    notes: 'Reported policy; offered as an option rather than applied automatically.',
    limitations: 'May vary by service or contract and may change.',
  },
  {
    id: 'air-6000',
    service: 'General air cargo planning (IATA convention)',
    region: 'International air freight',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 6000,
    unit: 'cm³ per kg',
    effectiveDate: null,
    source: 'iata-volumetric',
    verified: '2026-10-06',
    notes: 'Commonly referenced general air cargo volumetric convention.',
    limitations: 'Airlines and forwarders set their own divisor and rounding.',
  },
  {
    id: 'air-5000',
    service: 'Express / courier air services (reference)',
    region: 'International air freight',
    ruleType: 'dim-divisor',
    parameter: 'divisor',
    value: 5000,
    unit: 'cm³ per kg',
    effectiveDate: null,
    source: 'iata-volumetric',
    verified: '2026-10-06',
    notes: 'Many express services use 5,000 and often compare per piece.',
    limitations: 'Service specific.',
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

const base: Pick<DimRule, 'weightRounding'> = { weightRounding: 'none' };

/** Dimensional weight presets (parcel/courier). */
export const dimPresets: DimPreset[] = [
  {
    id: 'parcel-139',
    label: '139 in³/lb (UPS & FedEx U.S. standard daily rates reference)',
    rule: { divisor: 139, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', roundDimensionsUp: false, basis: 'piece', ...base },
    ruleId: 'parcel-139',
    source: 'parcel-dim-us',
    verified: '2026-10-06',
    applicability: 'UPS and FedEx domestic standard daily rate parcel tariffs in inches and pounds. Evaluated per package.',
    limitation: 'Not an LTL, air freight, or ocean rule. Commercial accounts frequently negotiate 166, 194, or custom divisors.',
  },
  {
    id: 'parcel-5000',
    label: '5,000 cm³/kg (DHL Express & international courier metric reference)',
    rule: { divisor: 5000, divisorLengthUnit: 'cm', divisorWeightUnit: 'kg', roundDimensionsUp: false, basis: 'piece', ...base },
    ruleId: 'parcel-5000',
    source: 'parcel-dim-us',
    verified: '2026-10-06',
    applicability: 'International courier services (DHL Express, FedEx Express International, UPS International) using metric centimeters and kilograms.',
    limitation: 'Specific service tariffs and negotiated contracts differ. Confirm with your carrier schedule.',
  },
  {
    id: 'parcel-166',
    label: '166 in³/lb (USPS Priority Mail > 1 cu ft & retail counter rate reference)',
    rule: { divisor: 166, divisorLengthUnit: 'in', divisorWeightUnit: 'lb', roundDimensionsUp: false, basis: 'piece', ...base },
    ruleId: 'parcel-166',
    source: 'usps-dmm-standards',
    verified: '2026-10-06',
    applicability: 'USPS Priority Mail and Ground Advantage parcels exceeding 1 cubic foot (1,728 in³); also common for retail counter rates.',
    limitation: 'Does not apply to UPS/FedEx standard published commercial rates unless specified by contract.',
  },
];

/** Air freight presets: shipment-level by default for general cargo. */
export const airPresets: DimPreset[] = [
  {
    id: 'air-6000',
    label: '6,000 cm³/kg (IATA general air cargo TACT Rule 3.9.4 planning reference)',
    rule: { divisor: 6000, divisorLengthUnit: 'cm', divisorWeightUnit: 'kg', roundDimensionsUp: false, basis: 'shipment', weightRounding: 'half' },
    ruleId: 'air-6000',
    source: 'iata-volumetric',
    verified: '2026-10-06',
    applicability: 'General international air cargo booked through commercial airlines and IATA freight forwarders (1 cbm = 166.67 kg). Calculated for the entire shipment.',
    limitation: 'Not universal. Express air services, domestic air cargo, and specific airline tariffs may use 5,000 or custom divisors. Rounding up to 0.5 kg increments is typical but subject to carrier tariff.',
  },
  {
    id: 'air-5000',
    label: '5,000 cm³/kg (International express courier air reference)',
    rule: { divisor: 5000, divisorLengthUnit: 'cm', divisorWeightUnit: 'kg', roundDimensionsUp: false, basis: 'piece', weightRounding: 'half' },
    ruleId: 'air-5000',
    source: 'iata-volumetric',
    verified: '2026-10-06',
    applicability: 'Express courier air shipments (e.g. DHL Express, FedEx Priority, UPS Worldwide Express) evaluated per individual piece.',
    limitation: 'Do not apply courier express divisors to standard airline freight bookings unless instructed by your forwarder.',
  },
];

export const dimPresetById = (id: string) => dimPresets.find((p) => p.id === id);
export const airPresetById = (id: string) => airPresets.find((p) => p.id === id);
