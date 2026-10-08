import { describe, expect, it } from 'vitest'
import { formatLongDate } from './format-date'

describe('formatLongDate', () => {
  it('writes the date in Cairo time, with Western digits in Arabic', () => {
    const date = new Date('2026-11-07T23:30:00Z') // already 8 November in Cairo
    expect(formatLongDate(date, 'en')).toBe('8 November 2026')
    const arabic = formatLongDate(date, 'ar')
    expect(arabic).toContain('8')
    expect(arabic).toContain('2026')
    expect(arabic).not.toMatch(/[٠-٩]/)
  })
})
