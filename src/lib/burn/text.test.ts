import { describe, expect, it } from 'vitest'
import { say, weekdayNames } from './text'

describe('library text', () => {
  it('picks the reader language', () => {
    expect(say({ en: 'Squat', ar: 'سكوات' }, 'ar')).toBe('سكوات')
    expect(say({ en: 'Squat', ar: 'سكوات' }, 'en')).toBe('Squat')
  })

  it('names the weekdays from Sunday', () => {
    expect(weekdayNames('en', 'short')).toEqual(['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'])
    expect(weekdayNames('en', 'long')[4]).toBe('Thursday')
    expect(weekdayNames('ar', 'long')[0]).toBe('الأحد')
  })
})
