import { describe, expect, it } from 'vitest'
import { parseBedConfiguration, parseRoomTypes } from './csvParser'

describe('parseBedConfiguration', () => {
  it('parses a single bed', () => {
    const beds = parseBedConfiguration('1 single', 'room1')
    expect(beds).toHaveLength(1)
    expect(beds[0].type).toBe('single')
    expect(beds[0].id).toBe('room1-bed-0')
  })

  it('parses multiple single beds', () => {
    const beds = parseBedConfiguration('3 single', 'room1')
    expect(beds).toHaveLength(3)
    for (const bed of beds) {
      expect(bed.type).toBe('single')
    }
  })

  it('parses a double_single bed', () => {
    const beds = parseBedConfiguration('1 double_single', 'room1')
    expect(beds).toHaveLength(1)
    expect(beds[0].type).toBe('double_single')
  })

  it('parses a double_shared bed as two slots', () => {
    const beds = parseBedConfiguration('1 double_shared', 'room1')
    expect(beds).toHaveLength(2)
    expect(beds[0].type).toBe('double_shared')
    expect(beds[1].type).toBe('double_shared')
    expect(beds[0].id).toContain('spot1')
    expect(beds[1].id).toContain('spot2')
  })

  it('parses space-separated mixed bed configuration', () => {
    const beds = parseBedConfiguration('1 double_single 2 single', 'room1')
    expect(beds).toHaveLength(3)
    expect(beds[0].type).toBe('double_single')
    expect(beds[1].type).toBe('single')
    expect(beds[2].type).toBe('single')
  })

  it('generates labels using human-readable names', () => {
    const beds = parseBedConfiguration('1 single', 'room1')
    expect(beds[0].label).toBe('Single Bed')
  })

  it('generates slot labels for shared beds', () => {
    const beds = parseBedConfiguration('1 double_shared', 'room1')
    expect(beds[0].label).toBe('Double Bed (Shared) - Slot A')
    expect(beds[1].label).toBe('Double Bed (Shared) - Slot B')
  })

  it('throws a descriptive error for unknown bed type keys', () => {
    expect(() => parseBedConfiguration('1 unknown', 'room1')).toThrow('Unknown bed type: "unknown"')
  })

  it('returns empty array for empty string', () => {
    expect(parseBedConfiguration('', 'room1')).toHaveLength(0)
  })
})

describe('parseRoomTypes', () => {
  it('wraps a single room type in an array', () => {
    expect(parseRoomTypes('2A')).toEqual(['2A'])
  })

  it('splits multiple room types separated by / into an array', () => {
    expect(parseRoomTypes('2B/2C')).toEqual(['2B', '2C'])
  })

  it('trims whitespace from each room type', () => {
    expect(parseRoomTypes('2B / 2C')).toEqual(['2B', '2C'])
  })

  it('returns empty array for an empty string', () => {
    expect(parseRoomTypes('')).toEqual([])
  })
})
