/** Pallet footprint reference sizes (mm). Source: ISO 6780 principal footprints and EPAL for the Euro pallet. */
export interface PalletSize {
  id: string;
  label: string;
  /** footprint in millimetres */
  lengthMm: number;
  widthMm: number;
  inches: string;
  regions: string;
  source: string;
  note: string;
}

export const palletSizes: PalletSize[] = [
  { id: 'eur', label: 'Euro pallet (EUR / EPAL)', lengthMm: 1200, widthMm: 800, inches: '47.2 × 31.5 in', regions: 'Europe and many international flows', source: 'epal-euro-pallet', note: 'Also listed in ISO 6780. Genuine EPAL marking is required for EPAL compliance.' },
  { id: 'eur2', label: 'Industrial / EUR 2 (1200 × 1000)', lengthMm: 1200, widthMm: 1000, inches: '47.2 × 39.4 in', regions: 'Europe, Asia and global industrial use', source: 'iso-6780', note: 'ISO 6780 footprint.' },
  { id: 'gma', label: 'North American standard (48 × 40 in)', lengthMm: 1219, widthMm: 1016, inches: '48 × 40 in', regions: 'U.S./Canada', source: 'iso-6780', note: 'ISO 6780 footprint 1219 × 1016 mm. Often called the GMA pallet in grocery supply chains.' },
  { id: 'sq1067', label: '42 × 42 in', lengthMm: 1067, widthMm: 1067, inches: '42 × 42 in', regions: 'North America (telecom, paint, drums)', source: 'iso-6780', note: 'ISO 6780 footprint 1067 × 1067 mm.' },
  { id: 'sq1100', label: '1100 × 1100 mm', lengthMm: 1100, widthMm: 1100, inches: '43.3 × 43.3 in', regions: 'Asia (Japan, Korea)', source: 'iso-6780', note: 'ISO 6780 footprint.' },
  { id: 'sq1140', label: '1140 × 1140 mm', lengthMm: 1140, widthMm: 1140, inches: '44.9 × 44.9 in', regions: 'Australia', source: 'iso-6780', note: 'ISO 6780 footprint.' },
];

export const palletSizeById = (id: string) => palletSizes.find((p) => p.id === id);
