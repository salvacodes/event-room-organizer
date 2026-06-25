import type { BedType } from '../../shared/bedTypes'
import { getBedTypeLabel } from '../../shared/bedTypes'
import type { Bed } from '../../shared/types'

const VALID_BED_TYPES: ReadonlySet<string> = new Set<BedType>(['single', 'double_single', 'double_shared'])

function isBedType(value: string): value is BedType {
  return VALID_BED_TYPES.has(value)
}

export function parseCSV(text: string): string[][] {
  const lines: string[][] = []
  let row: string[] = []
  let inQuotes = false
  let currentValue = ''

  for (let i = 0; i < text.length; i++) {
    const char = text[i]
    const nextChar = text[i + 1]

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        currentValue += '"'
        i++
      } else {
        inQuotes = !inQuotes
      }
    } else if (char === ',' && !inQuotes) {
      row.push(currentValue.trim())
      currentValue = ''
    } else if ((char === '\r' || char === '\n') && !inQuotes) {
      row.push(currentValue.trim())
      if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
        lines.push(row)
      }
      row = []
      currentValue = ''
      if (char === '\r' && nextChar === '\n') {
        i++
      }
    } else {
      currentValue += char
    }
  }

  if (currentValue !== '' || row.length > 0) {
    row.push(currentValue.trim())
  }
  if (row.length > 0 && (row.length > 1 || row[0] !== '')) {
    lines.push(row)
  }

  return lines
}

export function parseBedConfiguration(configStr: string, roomId: string): Bed[] {
  if (!configStr) return []
  const beds: Bed[] = []
  let bedIndex = 0

  const pairs = [...configStr.matchAll(/(\d+)\s+(\w+)/g)]

  for (const [, countStr, key] of pairs) {
    if (!isBedType(key)) {
      throw new Error(`Unknown bed type: "${key}". Valid types are: single, double_single, double_shared`)
    }
    const count = parseInt(countStr, 10)

    for (let i = 0; i < count; i++) {
      if (key === 'double_shared') {
        const uniqueBedId = bedIndex++
        beds.push({
          id: `${roomId}-bed-${uniqueBedId}-spot1`,
          type: 'double_shared',
          label: `${getBedTypeLabel('double_shared')} - Slot A`,
          assignedParticipantId: null
        })
        beds.push({
          id: `${roomId}-bed-${uniqueBedId}-spot2`,
          type: 'double_shared',
          label: `${getBedTypeLabel('double_shared')} - Slot B`,
          assignedParticipantId: null
        })
      } else {
        beds.push({
          id: `${roomId}-bed-${bedIndex++}`,
          type: key,
          label: getBedTypeLabel(key),
          assignedParticipantId: null
        })
      }
    }
  }

  return beds
}
