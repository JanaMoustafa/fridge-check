import { describe, expect, it } from 'vitest'
import { foldForSearch } from './search'

describe('foldForSearch', () => {
  it('ignores case and Latin accents', () => {
    expect(foldForSearch('Albóndigas EN Chipotle')).toBe('albondigas en chipotle')
  })

  it('treats the Arabic spellings people type interchangeably as the same', () => {
    expect(foldForSearch('مُلُوخِيّة')).toBe(foldForSearch('ملوخيه'))
    expect(foldForSearch('أرز بالشعرية')).toBe(foldForSearch('ارز بالشعريه'))
    expect(foldForSearch('مقلوبة')).toContain(foldForSearch('مقلوبه'))
    expect(foldForSearch('حلوى')).toBe(foldForSearch('حلوي'))
  })
})
