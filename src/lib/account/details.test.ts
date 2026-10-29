import { describe, expect, it } from 'vitest'
import { normalizePhone, parseDetailsForm } from './details'

describe('normalizePhone', () => {
  it.each([
    ['+20 100 123 4567', '+201001234567'],
    ['0100-123-4567', '01001234567'],
    ['(02) 2735 1234', '0227351234'],
    ['٠١٠٠١٢٣٤٥٦٧', '01001234567'],
    ['', null],
    ['   ', null],
  ])('%s → %s', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected)
  })

  it.each(['12345', '+1234567890123456', 'call me', '010-abc'])('rejects %s', (input) => {
    expect(normalizePhone(input)).toBe('invalid')
  })
})

describe('parseDetailsForm', () => {
  it('accepts a name and an optional phone', () => {
    expect(parseDetailsForm({ name: '  Nour   Adel ', phone: '' })).toEqual({
      ok: true,
      values: { name: 'Nour Adel', phone: null },
    })
  })

  it('reports each problem by field', () => {
    expect(parseDetailsForm({ name: '', phone: '123' })).toEqual({
      ok: false,
      errors: { name: 'required', phone: 'invalid' },
    })
    expect(parseDetailsForm({ name: 'x'.repeat(81) })).toEqual({
      ok: false,
      errors: { name: 'tooLong' },
    })
  })
})
