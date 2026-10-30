import { describe, expect, it } from 'vitest'
import { entryDecision, isPublicPath, signInRequired } from './entry'

const ENV = {
  DATABASE_URL: 'postgres://x',
  BETTER_AUTH_SECRET: 's'.repeat(32),
  BETTER_AUTH_URL: 'https://example.com',
  GOOGLE_CLIENT_ID: 'id',
  GOOGLE_CLIENT_SECRET: 'secret',
}

describe('signInRequired', () => {
  it('is on only when every sign-in setting is there', () => {
    expect(signInRequired(ENV)).toBe(true)
    expect(signInRequired({ ...ENV, GOOGLE_CLIENT_SECRET: ' ' })).toBe(false)
    expect(signInRequired({})).toBe(false)
  })
})

describe('isPublicPath', () => {
  it('opens the intro, legal and pricing pages, auth and payment callbacks and site files', () => {
    for (const path of [
      '/welcome',
      '/privacy',
      '/terms',
      '/refunds',
      '/pro',
      '/api/auth/callback/google',
      '/api/webhooks/xpay',
      '/manifest.webmanifest',
      '/icon.svg',
      '/_next/static/chunks/a.js',
      '/ocr/worker.min.js',
    ]) {
      expect(isPublicPath(path), path).toBe(true)
    }
    for (const path of [
      '/',
      '/saved',
      '/pro/success',
      '/burn',
      '/api/recipes/search',
      '/welcome2',
    ]) {
      expect(isPublicPath(path), path).toBe(false)
    }
  })
})

describe('entryDecision', () => {
  const decide = (pathname: string, search = '', hasSession = false, required = true) =>
    entryDecision({ pathname, search, hasSession, required })

  it('sends signed-out visitors to the intro page, remembering where they were going', () => {
    expect(decide('/')).toEqual({ kind: 'welcome', location: '/welcome' })
    expect(decide('/recipe/local/1', '?i=rice')).toEqual({
      kind: 'welcome',
      location: '/welcome?next=%2Frecipe%2Flocal%2F1%3Fi%3Drice',
    })
  })

  it('answers signed-out API calls with 401 instead of a page', () => {
    expect(decide('/api/recipes/search', '?i=rice')).toEqual({ kind: 'unauthorized' })
  })

  it('lets members, public pages and the account-free app through', () => {
    expect(decide('/saved', '', true)).toEqual({ kind: 'allow' })
    expect(decide('/privacy')).toEqual({ kind: 'allow' })
    expect(decide('/saved', '', false, false)).toEqual({ kind: 'allow' })
  })
})
