import type { ContainerSpec } from '../calculations/container';

/**
 * Equipment preset registry. Values are REFERENCE planning specifications, not universal truths.
 * All lengths in millimetres, weights in kilograms. null = not source-backed, not shown as a limit.
 */
export interface EquipmentPreset {
  id: string;
  label: string;
  internalLength: number;
  internalWidth: number;
  internalHeight: number;
  doorWidth: number | null;
  doorHeight: number | null;
  /** approximate maximum cargo payload reference */
  payloadKg: number | null;
  maxGrossKg: number | null;
  tareKg: number | null;
  source: string; // source registry id
  verified: string;
  notes: string;
}

export const EQUIPMENT_NOTE =
  'REFERENCE EQUIPMENT SPECIFICATION: Actual equipment dimensions, tare weights, and payload ratings vary by manufacturer, container build year, and ocean line. Always inspect the CSC safety approval plate on the physical container provided for your shipment.';

const V = '2026-10-06';

export const equipment: EquipmentPreset[] = [
  {
    id: '20ft',
    label: '20 ft standard dry',
    internalLength: 5896,
    internalWidth: 2350,
    internalHeight: 2393,
    doorWidth: 2340,
    doorHeight: 2274,
    payloadKg: 28200,
    maxGrossKg: 30480,
    tareKg: 2280,
    source: 'container-line-specs',
    verified: V,
    notes: 'Reference ISO dry freight container. ISO 668 rating: 30,480 kg max gross. Door openings typically 2,340 mm W × 2,274–2,280 mm H. Actual payload depends on unit tare stamped on door plate.',
  },
  {
    id: '40ft',
    label: '40 ft standard dry',
    internalLength: 12032,
    internalWidth: 2350,
    internalHeight: 2393,
    doorWidth: 2340,
    doorHeight: 2274,
    payloadKg: 28800,
    maxGrossKg: 32500,
    tareKg: 3700,
    source: 'container-line-specs',
    verified: V,
    notes: 'Reference dry freight container. Modern carriers rate gross capacity up to 32,500 kg (standard ISO rating 30,480 kg). Actual payload depends on unit tare stamped on door plate.',
  },
  {
    id: '40hc',
    label: '40 ft high cube dry',
    internalLength: 12032,
    internalWidth: 2350,
    internalHeight: 2697,
    doorWidth: 2340,
    doorHeight: 2577,
    payloadKg: 28620,
    maxGrossKg: 32500,
    tareKg: 3880,
    source: 'container-line-specs',
    verified: V,
    notes: 'Reference high cube container (~300 mm / 1 ft taller than standard 40 ft). Gross rating 32,500 kg. Door height typically 2,577–2,585 mm. Actual payload depends on unit tare stamped on door plate.',
  },
];

export const equipmentById = (id: string): EquipmentPreset | undefined => equipment.find((e) => e.id === id);

export function toContainerSpec(e: EquipmentPreset): ContainerSpec {
  return {
    name: e.label,
    length: e.internalLength,
    width: e.internalWidth,
    height: e.internalHeight,
    doorWidth: e.doorWidth,
    doorHeight: e.doorHeight,
    maxPayloadKg: e.payloadKg,
  };
}
