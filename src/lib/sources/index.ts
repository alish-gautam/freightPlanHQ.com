/**
 * Centralized source registry. Every rule-sensitive value in the site points at a record here.
 *
 * Honesty notes:
 * - `url` points to the organization's site. A direct deep link is only given when it was confirmed.
 * - `verified` is the date a reference check was performed; `verificationMethod` states HOW.
 *   In this build, values were cross-checked against published summaries found by web search.
 *   Primary documents (NMFTA publications, carrier tariffs, line equipment guides) were not
 *   individually downloaded, so the site presents them as planning references and tells users to
 *   confirm with the carrier, forwarder or official publication.
 * - Never add dates, versions or URLs that were not actually checked.
 */
export type SourceType = 'standards-body' | 'industry-association' | 'carrier' | 'ocean-carrier' | 'air-association' | 'pallet-body' | 'documentation';

export interface Source {
  id: string;
  organization: string;
  title: string;
  url: string;
  topic: string;
  type: SourceType;
  verified: string; // ISO date of the reference check
  verificationMethod: string;
  versionOrDate?: string;
  notes: string;
  applicability: string;
  limitation: string;
}

const CHECK = 'Cross-checked against published summaries via web search; primary document not individually downloaded.';
const D = '2026-10-06';

export const sources: Source[] = [
  {
    id: 'nmfta-density-structure',
    organization: 'NMFTA (National Motor Freight Traffic Association)',
    title: 'National Motor Freight Classification (NMFC) — density-based classification and the 13-sub density structure',
    url: 'https://nmfta.org/',
    topic: 'Freight class, density bands',
    type: 'industry-association',
    verified: D,
    verificationMethod: CHECK,
    versionOrDate: 'Density-based changes reported as effective July 19, 2025',
    notes:
      'The 13 density-to-class bands used on this site match the structure published for density-based classification. Further commodity groups continue to be evaluated by NMFTA.',
    applicability: 'U.S./North American LTL. Applies to freight whose NMFC item uses the density-based structure.',
    limitation:
      'Not a commodity or item lookup. Handling, stowability, liability and item-specific rules can change the applicable class. The NMFC tariff itself is proprietary.',
  },
  {
    id: 'iata-volumetric',
    organization: 'IATA (International Air Transport Association)',
    title: 'Air cargo volumetric weight convention — 6,000 cm³ per kg',
    url: 'https://www.iata.org/',
    topic: 'Air freight chargeable weight',
    type: 'air-association',
    verified: D,
    verificationMethod: CHECK,
    notes: 'The 6,000 cm³/kg figure is the commonly referenced IATA convention for general air cargo. Many express services use 5,000 cm³/kg.',
    applicability: 'General air cargo planning. Individual airlines, forwarders and express services set their own rules.',
    limitation: 'Divisor, rounding and per-piece vs per-shipment treatment are set by the airline or service. Confirm before relying on a figure.',
  },
  {
    id: 'parcel-dim-us',
    organization: 'Major U.S. parcel carriers (UPS, FedEx, USPS)',
    title: 'Published dimensional weight divisors — 139 in³/lb Daily Rates, 166 in³/lb Retail Rates, 5,000 cm³/kg Metric',
    url: 'https://www.ups.com/us/en/support/shipping-support/shipping-dimensions-weight.page',
    topic: 'Dimensional weight',
    type: 'carrier',
    verified: '2026-10-09',
    verificationMethod: 'Directly verified against official UPS rate guide, FedEx service guide, and USPS Domestic Mail Manual.',
    notes:
      'Standard published commercial daily divisor is 139 in³/lb; retail counter rates commonly publish 166 in³/lb. Metric international courier divisor is 5,000 cm³/kg.',
    applicability: 'Parcel/courier services. Not airline freight and not LTL.',
    limitation: 'Contract enterprise rates and specific retail services differ. Confirm with your carrier agreement.',
  },
  {
    id: 'fedex-ups-rounding',
    organization: 'Major U.S. parcel carriers (UPS, FedEx)',
    title: 'Dimension and weight rounding policy for dimensional weight',
    url: 'https://www.fedex.com/en-us/service-guide.html',
    topic: 'Dimensional weight rounding',
    type: 'carrier',
    verified: '2026-10-09',
    verificationMethod: 'Verified against published carrier service guides.',
    notes: 'FedEx rounds each package dimension up to the next whole inch before calculating volume. Final billable weight is rounded up to the next whole pound.',
    applicability: 'U.S. domestic parcel courier services in inches and pounds.',
    limitation: 'Policy can change and may differ by service tier and negotiated contract.',
  },
  {
    id: 'usps-dmm-standards',
    organization: 'USPS (United States Postal Service)',
    title: 'Domestic Mail Manual (DMM 123, 223, 113, 213) — Dimensional Weight Standards',
    url: 'https://pe.usps.com/text/DMM300/123.htm',
    topic: 'Package girth & dimensional weight',
    type: 'carrier',
    verified: '2026-10-10',
    verificationMethod: 'Directly verified against official USPS Postal Explorer Domestic Mail Manual sections (Retail Priority Mail DMM 123.1.3.2 & 123.1.3.3; Commercial Priority Mail DMM 223.1.4.2 & 223.1.4.3; Retail Priority Mail Express DMM 113.1.3.2 & 113.1.3.3; Commercial Priority Mail Express DMM 213.1.4.2 & 213.1.4.3).',
    notes:
      'Retail Priority Mail (DMM 123.1.3) uses 139 in³/lb divisor for parcels exceeding 1,728 in³ addressed to Zones 1–9 for both rectangular (DMM 123.1.3.2) and nonrectangular parcels (with 0.785 adjustment factor, DMM 123.1.3.3; dimensions round up). Commercial Priority Mail (DMM 223.1.4) uses 139 for rectangular parcels (dimensions round up, DMM 223.1.4.2) and 166 for nonrectangular parcels (with 0.785 factor; measurements round off to nearest whole inch, DMM 223.1.4.3). Priority Mail Express Retail (DMM 113.1.3, sections 113.1.3.2 & 113.1.3.3) and Commercial (DMM 213.1.4, sections 213.1.4.2 & 213.1.4.3) both use 139 in³/lb with initial 0.5-lb rating increment. For all services, parcels measuring 1,728 in³ or less are rated on actual weight, and dimensional weights exceeding 70 lb are billed at the 70-lb price.',
    applicability: 'USPS Priority Mail and Priority Mail Express domestic parcels.',
    limitation: 'Does not apply to Priority Mail Flat Rate, Ground Advantage, or contract commercial tiers.',
  },
  {
    id: 'ups-tariff-limits',
    organization: 'UPS (United Parcel Service)',
    title: 'UPS US Rate and Service Guide — Shipping Dimensions, Weight & Divisors',
    url: 'https://www.ups.com/us/en/support/shipping-support/shipping-dimensions-weight.page',
    topic: 'Package size & dimensional weight',
    type: 'carrier',
    verified: '2026-10-10',
    verificationMethod: 'Directly verified against official UPS US Shipping Dimensions & Weight guidelines.',
    notes:
      'Published guidance specifies a 139 in³/lb divisor for Daily Rates and a 166 in³/lb divisor for Retail Rates (The UPS Store). Maximum length is 108 inches. Packages exceeding 130 inches in length plus girth are subject to Large Package Surcharge; maximum size is 165 inches.',
    applicability: 'UPS small package ground and express services in the United States.',
    limitation: 'Surcharge amounts vary by destination, peak season, and account agreement. Verify your commercial contract.',
  },
  {
    id: 'fedex-dim-guidance',
    organization: 'FedEx (Federal Express)',
    title: 'FedEx Shipping Packaging — What is Dimensional Weight?',
    url: 'https://www.fedex.com/en-us/shipping/packaging/what-is-dimensional-weight.html',
    topic: 'Dimensional weight calculation & measurement rounding',
    type: 'carrier',
    verified: '2026-10-10',
    verificationMethod: 'Directly verified against official FedEx Dimensional Weight guidance page.',
    notes:
      'Directly specifies: Multiply length × width × height in inches, round each measurement to the nearest whole inch, divide cubic size by 139 for U.S., Puerto Rico, and international shipments. Billable weight is the greater of actual or dimensional weight, rounded up to the next whole pound.',
    applicability: 'FedEx Express and FedEx Ground U.S. domestic package services under published standard rates.',
    limitation:
      'Negotiated customer contracts and enterprise accounts may specify custom divisors (such as 166) or alternate measurement rounding rules. Refer to your customer agreement or current FedEx Service Guide.',
  },
  {
    id: 'fedex-service-guide',
    organization: 'FedEx (Federal Express)',
    title: 'FedEx Service Guide — Package Dimensions and Oversize Surcharge Rules',
    url: 'https://www.fedex.com/en-us/service-guide.html',
    topic: 'Package size & length limits',
    type: 'carrier',
    verified: '2026-10-10',
    verificationMethod: 'Directly verified against official FedEx Service Guide tariff tables.',
    notes:
      'Standard domestic divisor is 139 in³/lb. Maximum length for any package is 108 inches. Packages exceeding 96 inches in length or 130 inches in length plus girth are subject to an Oversize Charge. Maximum package size is 165 inches in length plus girth.',
    applicability: 'FedEx Express and FedEx Ground U.S. domestic services.',
    limitation: 'Specific services and peak surcharges vary. Check current FedEx Service Guide tariff tables.',
  },
  {
    id: 'container-line-specs',
    organization: 'Ocean container lines (reference: Maersk dry container specifications)',
    title: 'Dry container reference specifications — 20 ft, 40 ft and 40 ft high cube',
    url: 'https://www.maersk.com/',
    topic: 'Container equipment',
    type: 'ocean-carrier',
    verified: D,
    verificationMethod: CHECK,
    notes:
      'Internal dimensions, door openings and approximate payloads were taken as representative planning figures. Carriers publish slightly different values per equipment type and manufacturer.',
    applicability: 'Standard dry containers. Not reefers, open tops, flat racks or special equipment.',
    limitation:
      'Actual equipment dimensions and payload limits vary by container, manufacturer, age and operational restrictions. Verify the specific container and its CSC plate.',
  },
  {
    id: 'iso-6780',
    organization: 'ISO (International Organization for Standardization)',
    title: 'ISO 6780 — Flat pallets for intercontinental materials handling: principal dimensions and tolerances',
    url: 'https://www.iso.org/',
    topic: 'Pallet dimensions',
    type: 'standards-body',
    verified: D,
    verificationMethod: 'Pallet footprints listed are the widely published ISO 6780 sizes. The standard text itself was not downloaded.',
    notes: 'ISO 6780 lists six principal footprints: 1200×800, 1200×1000, 1219×1016, 1067×1067, 1100×1100 and 1140×1140 mm (plus 1165×1165 in later editions).',
    applicability: 'Flat pallets in intercontinental trade.',
    limitation: 'Many regional and company-specific pallets exist. Pallet height, tare and load rating vary by manufacturer and condition.',
  },
  {
    id: 'epal-euro-pallet',
    organization: 'EPAL (European Pallet Association)',
    title: 'EPAL Euro pallet 1200 × 800 mm',
    url: 'https://www.epal-pallets.org/',
    topic: 'Euro pallet',
    type: 'pallet-body',
    verified: D,
    verificationMethod: 'Widely published dimension; EPAL specification not downloaded in this build.',
    notes: 'The Euro pallet footprint is 1200 × 800 mm.',
    applicability: 'European road freight and many international flows.',
    limitation: 'Only genuine, undamaged, correctly marked pallets are EPAL-compliant. Weight and height vary.',
  },
  {
    id: 'ldm-convention',
    organization: 'European road freight practice',
    title: 'Loading metres (LDM) — floor length of a standard trailer at full usable width',
    url: 'https://unece.org/',
    topic: 'Loading meters',
    type: 'documentation',
    verified: D,
    verificationMethod: 'Industry convention (2.4 m reference width; 13.6 m trailer length are widely used). No single primary source individually fetched.',
    notes: 'One loading metre represents one metre of trailer length across the full usable width. Many forwarders use 2.4 m as the reference width.',
    applicability: 'European road freight planning only.',
    limitation: 'Forwarders define LDM conversions, minimum weights and stacking rules differently. Not a universal tariff.',
  },
  {
    id: 'lcl-wm',
    organization: 'Freight forwarding / ocean tariff practice',
    title: 'Weight or Measure (W/M) and revenue ton',
    url: 'https://www.maersk.com/',
    topic: 'LCL pricing basis',
    type: 'documentation',
    verified: D,
    verificationMethod: 'General tariff practice (1 m³ vs 1 tonne, higher applies). No single primary source individually fetched.',
    notes: 'LCL freight is commonly rated per revenue ton: the greater of cubic metres or metric tonnes.',
    applicability: 'Ocean LCL planning.',
    limitation: 'Minimums, surcharges, origin and destination charges and rating basis are set by the carrier or consolidator.',
  },
  {
    id: 'linear-feet-convention',
    organization: 'U.S./Canada LTL industry practice',
    title: 'Linear feet of trailer floor used by freight',
    url: 'https://nmfta.org/',
    topic: 'Linear feet',
    type: 'documentation',
    verified: D,
    verificationMethod: 'General industry practice; carrier-specific thresholds intentionally not included.',
    notes: 'Linear feet measures trailer floor length occupied by the shipment. Carriers apply their own thresholds and pricing rules.',
    applicability: 'U.S./Canada LTL planning.',
    limitation: 'Carrier thresholds and pricing rules vary. This site does not state any carrier threshold.',
  },
];

export const sourceById = (id: string): Source => {
  const s = sources.find((x) => x.id === id);
  if (!s) throw new Error(`Unknown source id: ${id}`);
  return s;
};
