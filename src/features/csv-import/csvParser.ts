import type { Bed } from '../../shared/types'

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
  const elements = configStr.split(/[,;]/)
  let bedIndex = 0

  for (const element of elements) {
    const trimmed = element.trim()
    if (!trimmed) continue

    const match = trimmed.match(/^(\d+)\s+(.+)$/)
    let count = 1
    let bedDescription = trimmed
    if (match) {
      count = parseInt(match[1], 10)
      bedDescription = match[2].trim()
    }

    const norm = bedDescription.toLowerCase()

    if (
      norm.includes('single occupancy') ||
      norm.includes('for single') ||
      norm.includes('double occupancy single') ||
      norm.includes('(single occupancy)')
    ) {
      for (let i = 0; i < count; i++) {
        beds.push({
          id: `${roomId}-bed-${bedIndex++}`,
          type: 'double bed (single occupancy)',
          label: 'Double Bed (Single Occupancy)',
          assignedParticipantId: null,
        })
      }
    } else if (
      norm.includes('shared') ||
      norm.includes('2 people') ||
      norm.includes('for 2') ||
      norm.includes('shared for 2 people') ||
      norm.includes('(shared)')
    ) {
      for (let i = 0; i < count; i++) {
        const uniqueBedId = bedIndex++
        beds.push({
          id: `${roomId}-bed-${uniqueBedId}-spot1`,
          type: 'double bed (shared)',
          label: 'Double Bed (Shared) - Slot A',
          assignedParticipantId: null,
        })
        beds.push({
          id: `${roomId}-bed-${uniqueBedId}-spot2`,
          type: 'double bed (shared)',
          label: 'Double Bed (Shared) - Slot B',
          assignedParticipantId: null,
        })
      }
    } else {
      for (let i = 0; i < count; i++) {
        beds.push({
          id: `${roomId}-bed-${bedIndex++}`,
          type: 'single bed',
          label: 'Single Bed',
          assignedParticipantId: null,
        })
      }
    }
  }

  return beds
}
