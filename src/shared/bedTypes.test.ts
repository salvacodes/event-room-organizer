import { describe, expect, it } from 'vitest'
import { getBedTypeLabel } from './bedTypes'

describe('getBedTypeLabel', () => {
  it('returns human-readable label for single', () => {
    expect(getBedTypeLabel('single')).toBe('Single Bed')
  })

  it('returns human-readable label for double_single', () => {
    expect(getBedTypeLabel('double_single')).toBe('Double Bed (Single Occupancy)')
  })

  it('returns human-readable label for double_shared', () => {
    expect(getBedTypeLabel('double_shared')).toBe('Double Bed (Shared)')
  })
})
