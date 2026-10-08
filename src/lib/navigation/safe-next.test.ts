import { describe, expect, it } from 'vitest'
import { safeNext } from './safe-next'

describe('safeNext', () => {
  it.each(['/', '/account', '/recipe/local/53027?i=rice,onion', '/profile?welcome=1'])(
    'keeps the site path %s',
    (path) => {
      expect(safeNext(path)).toBe(path)
    },
  )

  it.each([
    ['another site', 'https://evil.example/'],
    ['a protocol-relative URL', '//evil.example'],
    ['a backslash trick', '/\\evil.example'],
    ['a script URL', 'javascript:alert(1)'],
    ['a relative path', 'account'],
    ['a control character', '/a\nb'],
    ['a very long value', `/${'a'.repeat(600)}`],
    ['a non-string', 42],
    ['nothing', null],
  ])('refuses %s', (_label, value) => {
    expect(safeNext(value)).toBeNull()
  })
})
