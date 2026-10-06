import { describe, expect, it } from 'vitest'
import {
  DEFAULT_LOCALE,
  directionOf,
  isLocale,
  negotiateLocale,
  parseLocaleCookie,
  resolveLocale,
  serializeLocaleCookie,
} from './locale'

describe('isLocale', () => {
  it.each(['en', 'ar'])('accepts %s', (value) => expect(isLocale(value)).toBe(true))
  it.each(['fr', 'AR', '', null, undefined, 1, 'ar-EG'])('rejects %s', (value) =>
    expect(isLocale(value)).toBe(false),
  )
})

describe('directionOf', () => {
  it('is rtl for Arabic and ltr for English', () => {
    expect(directionOf('ar')).toBe('rtl')
    expect(directionOf('en')).toBe('ltr')
  })
})

describe('negotiateLocale', () => {
  it.each([
    [null, 'en'],
    ['', 'en'],
    ['ar', 'ar'],
    ['ar-EG,ar;q=0.9,en;q=0.8', 'ar'],
    ['en-US,en;q=0.9,ar;q=0.8', 'en'],
    ['fr-FR,fr;q=0.9,ar;q=0.5', 'ar'],
    ['fr-FR,de;q=0.9', 'en'],
    ['en;q=0.2,ar;q=0.7', 'ar'],
    ['ar;q=0,en;q=0.1', 'en'],
    ['ar;q=abc,en', 'en'],
    ['*', 'en'],
  ])('%s → %s', (header, expected) => expect(negotiateLocale(header)).toBe(expected))

  it('keeps header order for equal q-values', () => {
    expect(negotiateLocale('ar, en')).toBe('ar')
    expect(negotiateLocale('en, ar')).toBe('en')
  })
})

describe('resolveLocale', () => {
  it('prefers a valid cookie over the Accept-Language header', () => {
    expect(resolveLocale({ cookie: 'ar', acceptLanguage: 'en' })).toBe('ar')
  })
  it('ignores an invalid cookie', () => {
    expect(resolveLocale({ cookie: 'xx', acceptLanguage: 'ar' })).toBe('ar')
  })
  it('falls back to the default locale', () => {
    expect(resolveLocale({})).toBe(DEFAULT_LOCALE)
  })
})

describe('parseLocaleCookie', () => {
  it.each([
    ['NEXT_LOCALE=ar', 'ar'],
    ['a=1; NEXT_LOCALE=en; b=2', 'en'],
    ['a=1;NEXT_LOCALE=ar', 'ar'],
    ['', null],
    ['NEXT_LOCALE=fr', null],
    ['XNEXT_LOCALE=ar', null],
    ['NEXT_LOCALE=', null],
  ])('%s → %s', (cookie, expected) => expect(parseLocaleCookie(cookie)).toBe(expected))
})

describe('serializeLocaleCookie', () => {
  it('builds a one-year, lax, root-path cookie', () => {
    expect(serializeLocaleCookie('ar', { secure: false })).toBe(
      'NEXT_LOCALE=ar; Path=/; Max-Age=31536000; SameSite=Lax',
    )
  })
  it('adds Secure on https', () => {
    expect(serializeLocaleCookie('en', { secure: true })).toMatch(/; Secure$/)
  })
})
