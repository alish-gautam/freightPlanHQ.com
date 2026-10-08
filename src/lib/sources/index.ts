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
    organization: 'Major U.S. parcel carriers (UPS, FedEx)',
    title: 'Published dimensional weight divisors — 139 in³/lb and 5,000 cm³/kg for standard rates',
    url: 'https://www.ups.com/',
    topic: 'Dimensional weight',
    type: 'carrier',
    verified: D,
    verificationMethod: CHECK,
    notes:
      'Standard published divisors are reported as 139 (in³/lb) and 5,000 (cm³/kg). Some services, retail rates and contracts use other divisors (166 in³/lb is commonly cited). Recent policy changes were reported to round each dimension up to the next whole inch.',
    applicability: 'Parcel/courier services. Not airline freight and not LTL.',
    limitation: 'Contract rates and specific services differ. The rounding policy can change. Confirm with your carrier agreement.',
  },
  {
    id: 'fedex-ups-rounding',
    organization: 'Major U.S. parcel carriers (UPS, FedEx)',
    title: 'Dimension rounding policy for dimensional weight',
    url: 'https://www.fedex.com/',
    topic: 'Dimensional weight rounding',
    type: 'carrier',
    verified: D,
    verificationMethod: CHECK,
    notes: 'Reported as rounding each length, width and height up to the next whole inch before multiplying (policy reported from August 2025).',
    applicability: 'Parcel/courier services in inches.',
    limitation: 'Policy can change and may differ by service and contract. Use the rounding option only when it applies to your service.',
  },
  {
    id: 'usps-dmm-standards',
    organization: 'USPS (United States Postal Service)',
    title: 'Domestic Mail Manual (DMM) — Physical Standards for Parcels (DMM 101, 123, 223)',
    url: 'https://pe.usps.com/',
    topic: 'Package girth & dimensional weight',
    type: 'carrier',
    verified: D,
    verificationMethod: CHECK,
    notes:
      'Standard maximum size for Priority Mail and Ground Advantage is 108 inches in combined length and girth. Ground Advantage parcels measuring between 108 and 130 inches are mailable at oversized rates. Items exceeding 130 inches are nonmailable. Dimensional weight uses 166 divisor for parcels exceeding 1 cubic foot.',
    applicability: 'USPS domestic parcel services.',
    limitation: 'Special handling, balloon price, and nonstandard fees apply to specific dimensions. Confirm with current Postal Explorer rates.',
  },
  {
    id: 'ups-tariff-limits',
    organization: 'UPS (United Parcel Service)',
    title: 'UPS Rate and Service Guide — Maximum Size & Large Package Surcharge Rules',
    url: 'https://www.ups.com/',
    topic: 'Package size & length limits',
    type: 'carrier',
    verified: D,
    verificationMethod: CHECK,
    notes:
      'Maximum length for any single package is 108 inches. Packages exceeding 130 inches in combined length plus girth are subject to a Large Package Surcharge. Maximum package size is 165 inches in length plus girth; packages exceeding 165 inches are subject to Over Maximum Limits surcharges.',
    applicability: 'UPS small package ground and express services.',
    limitation: 'Surcharge amounts vary by destination, peak season, and account agreement. Verify your commercial contract.',
  },
  {
    id: 'fedex-service-guide',
    organization: 'FedEx (Federal Express)',
    title: 'FedEx Service Guide — Package Dimensions and Oversize Surcharge Rules',
    url: 'https://www.fedex.com/',
    topic: 'Package size & length limits',
    type: 'carrier',
    verified: D,
    verificationMethod: CHECK,
    notes:
      'Maximum length for any package is 108 inches. Packages exceeding 96 inches in length or 130 inches in length plus girth are subject to an Oversize Charge. Maximum package size is 165 inches in length plus girth; packages exceeding 165 inches are unauthorized in the small package network.',
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
