import { describe, expect, it } from 'vitest'

import en_allocation from './locales/en/allocation.json'
import en_common from './locales/en/common.json'
import en_csvImport from './locales/en/csvImport.json'
import en_report from './locales/en/report.json'
import es_allocation from './locales/es/allocation.json'
import es_common from './locales/es/common.json'
import es_csvImport from './locales/es/csvImport.json'
import es_report from './locales/es/report.json'

function flatKeys(obj: object, prefix = ''): string[] {
  return Object.entries(obj).flatMap(([k, v]) => {
    const full = prefix ? `${prefix}.${k}` : k
    return typeof v === 'object' && v !== null ? flatKeys(v as object, full) : [full]
  })
}

describe('translation key parity', () => {
  it('common: es has all keys from en', () => {
    expect(flatKeys(es_common)).toEqual(expect.arrayContaining(flatKeys(en_common)))
  })

  it('common: en has all keys from es', () => {
    expect(flatKeys(en_common)).toEqual(expect.arrayContaining(flatKeys(es_common)))
  })

  it('csvImport: es has all keys from en', () => {
    expect(flatKeys(es_csvImport)).toEqual(expect.arrayContaining(flatKeys(en_csvImport)))
  })

  it('csvImport: en has all keys from es', () => {
    expect(flatKeys(en_csvImport)).toEqual(expect.arrayContaining(flatKeys(es_csvImport)))
  })

  it('allocation: es has all keys from en', () => {
    expect(flatKeys(es_allocation)).toEqual(expect.arrayContaining(flatKeys(en_allocation)))
  })

  it('allocation: en has all keys from es', () => {
    expect(flatKeys(en_allocation)).toEqual(expect.arrayContaining(flatKeys(es_allocation)))
  })

  it('report: es has all keys from en', () => {
    expect(flatKeys(es_report)).toEqual(expect.arrayContaining(flatKeys(en_report)))
  })

  it('report: en has all keys from es', () => {
    expect(flatKeys(en_report)).toEqual(expect.arrayContaining(flatKeys(es_report)))
  })
})
