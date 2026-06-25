export type BedType = 'single' | 'double_single' | 'double_shared'

export const BED_TYPE_LABELS: Record<BedType, string> = {
  single: 'Single Bed',
  double_single: 'Double Bed (Single Occupancy)',
  double_shared: 'Double Bed (Shared)'
}

export function getBedTypeLabel(type: BedType): string {
  return BED_TYPE_LABELS[type]
}
