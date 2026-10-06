import { describe, expect, it, vi } from 'vitest'
import { PREPAINT_SCRIPT } from './prepaint-script'

interface Env {
  lang?: string
  cookie?: string
  local?: Record<string, string>
  session?: Record<string, string>
  protocol?: string
  throwOnStorage?: boolean
}

function run(env: Env) {
  const attrs = new Map<string, string>()
  const local = new Map(Object.entries(env.local ?? {}))
  const session = new Map(Object.entries(env.session ?? {}))
  const cookieWrites: string[] = []
  const reload = vi.fn()

  const storage = (map: Map<string, string>) => ({
    getItem: (k: string) => {
      if (env.throwOnStorage) throw new Error('SecurityError')
      return map.get(k) ?? null
    },
    setItem: (k: string, v: string) => {
      if (env.throwOnStorage) throw new Error('SecurityError')
      map.set(k, v)
    },
  })

  const head: Array<{ attrs: Map<string, string>; id?: string }> = []
  const document = {
    head: { prepend: (el: { attrs: Map<string, string>; id?: string }) => head.unshift(el) },
    createElement: () => {
      const attrs = new Map<string, string>()
      return { attrs, id: '', setAttribute: (k: string, v: string) => attrs.set(k, v) }
    },
    documentElement: {
      lang: env.lang ?? 'en',
      setAttribute: (k: string, v: string) => attrs.set(k, v),
    },
    get cookie() {
      return env.cookie ?? ''
    },
    set cookie(value: string) {
      cookieWrites.push(value)
    },
  }
  const location = { protocol: env.protocol ?? 'http:', reload }

  new Function('document', 'localStorage', 'sessionStorage', 'location', PREPAINT_SCRIPT)(
    document,
    storage(local),
    storage(session),
    location,
  )
  return { attrs, head, local, session, cookieWrites, reload }
}

describe('pre-paint script', () => {
  it('applies a stored explicit theme and its browser-chrome colour', () => {
    const { attrs, head } = run({ local: { 'fc:theme': 'dark' } })
    expect(attrs.get('data-theme')).toBe('dark')
    expect(head[0]?.id).toBe('fc-theme-color')
    expect(head[0]?.attrs.get('name')).toBe('theme-color')
    expect(head[0]?.attrs.get('content')).toBe('#121916')
  })

  it('uses the light canvas colour for a forced light theme', () => {
    expect(run({ local: { 'fc:theme': 'light' } }).head[0]?.attrs.get('content')).toBe('#edf2ef')
  })

  it('ignores system or invalid stored themes', () => {
    expect(run({ local: { 'fc:theme': 'system' } }).attrs.has('data-theme')).toBe(false)
    expect(run({ local: { 'fc:theme': 'system' } }).head).toHaveLength(0)
    expect(run({ local: { 'fc:theme': '<script>' } }).attrs.has('data-theme')).toBe(false)
  })

  it('mirrors the locale cookie into empty storage', () => {
    const { local, reload, cookieWrites } = run({ cookie: 'a=1; NEXT_LOCALE=ar', lang: 'ar' })
    expect(local.get('fc:locale')).toBe('ar')
    expect(reload).not.toHaveBeenCalled()
    expect(cookieWrites).toHaveLength(0)
  })

  it('restores the cookie from storage and reloads once when the page rendered another locale', () => {
    const result = run({ lang: 'en', local: { 'fc:locale': 'ar' } })
    expect(result.cookieWrites).toEqual(['NEXT_LOCALE=ar; Path=/; Max-Age=31536000; SameSite=Lax'])
    expect(result.reload).toHaveBeenCalledTimes(1)
    expect(result.session.get('fc:locale-sync')).toBe('ar')
  })

  it('restores the cookie without reloading when the page already matches', () => {
    const result = run({ lang: 'ar', local: { 'fc:locale': 'ar' }, protocol: 'https:' })
    expect(result.cookieWrites[0]).toMatch(/; Secure$/)
    expect(result.reload).not.toHaveBeenCalled()
  })

  it('never reloads twice in one session (no loop when cookies are blocked)', () => {
    const result = run({
      lang: 'en',
      local: { 'fc:locale': 'ar' },
      session: { 'fc:locale-sync': 'ar' },
    })
    expect(result.reload).not.toHaveBeenCalled()
    expect(result.cookieWrites).toHaveLength(0)
  })

  it('does nothing when cookie and storage agree', () => {
    const result = run({ cookie: 'NEXT_LOCALE=en', local: { 'fc:locale': 'en' } })
    expect(result.cookieWrites).toHaveLength(0)
    expect(result.reload).not.toHaveBeenCalled()
  })

  it('survives storage that throws', () => {
    expect(() => run({ throwOnStorage: true, cookie: 'NEXT_LOCALE=ar' })).not.toThrow()
  })
})
