import { describe, expect, it } from 'vitest'
import { withStrictSsl } from './connection'

const NEON =
  'postgresql://user:secret@ep-x-pooler.eu-central-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require'

describe('withStrictSsl', () => {
  it('upgrades lenient SSL modes to verify-full and keeps everything else', () => {
    const url = new URL(withStrictSsl(NEON))
    expect(url.searchParams.get('sslmode')).toBe('verify-full')
    expect(url.searchParams.get('channel_binding')).toBe('require')
    expect(`${url.username}:${url.password}@${url.host}${url.pathname}`).toBe(
      'user:secret@ep-x-pooler.eu-central-1.aws.neon.tech/neondb',
    )
  })

  it.each(['prefer', 'verify-ca'])('upgrades sslmode=%s', (mode) => {
    expect(withStrictSsl(`postgresql://h/db?sslmode=${mode}`)).toContain('sslmode=verify-full')
  })

  it('leaves strict, disabled or absent modes alone', () => {
    expect(withStrictSsl('postgresql://h/db?sslmode=verify-full')).toContain('sslmode=verify-full')
    expect(withStrictSsl('postgresql://localhost/db?sslmode=disable')).toContain('sslmode=disable')
    expect(withStrictSsl('postgresql://localhost/db')).not.toContain('sslmode')
  })
})
