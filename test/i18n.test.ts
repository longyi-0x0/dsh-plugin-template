import { describe, expect, it } from 'vitest'

import { dictionaries } from '../src/client/i18n'

describe('locale dictionaries', () => {
  it('has the same keys in both languages', () => {
    expect(Object.keys(dictionaries.zh).sort()).toEqual(Object.keys(dictionaries.en).sort())
  })

  it('has no empty values', () => {
    for (const value of Object.values(dictionaries.en)) expect(value.trim()).not.toBe('')
    for (const value of Object.values(dictionaries.zh)) expect(value.trim()).not.toBe('')
  })
})
