import { describe, expect, it } from 'vitest'
import { cairoDate, fatMassOf, fatPercentOf, nextScanDue, parseScanForm } from './inbody'

const NOW = new Date('2026-10-29T12:00:00Z')

describe('parseScanForm', () => {
  it('reads a full sheet, rounding to one decimal', () => {
    expect(
      parseScanForm(
        {
          scannedOn: '2026-10-27',
          weightKg: '68.04',
          smmKg: '24,1',
          bfmKg: '22.6',
          pbf: '33.2',
          bmrKcal: '1360',
          vfl: '8',
          tbwL: '33.2',
        },
        NOW,
      ),
    ).toEqual({
      ok: true,
      values: {
        scannedOn: '2026-10-27',
        weightKg: 68,
        smmKg: 24.1,
        bfmKg: 22.6,
        pbf: 33.2,
        bmrKcal: 1360,
        vfl: 8,
        tbwL: 33.2,
      },
    })
  })

  it('needs only the weight, accepts Arabic digits and defaults the date to today in Cairo', () => {
    expect(parseScanForm({ weightKg: '٦٨٫٥' }, NOW)).toEqual({
      ok: true,
      values: {
        scannedOn: '2026-10-29',
        weightKg: 68.5,
        smmKg: null,
        bfmKg: null,
        pbf: null,
        bmrKcal: null,
        vfl: null,
        tbwL: null,
      },
    })
  })

  it('reports each problem by field', () => {
    expect(
      parseScanForm({ weightKg: '', pbf: '90', bmrKcal: 'abc', scannedOn: '2026-11-02' }, NOW),
    ).toEqual({
      ok: false,
      errors: { weightKg: 'required', pbf: 'range', bmrKcal: 'range', scannedOn: 'date' },
    })
    expect(parseScanForm({ weightKg: '70', scannedOn: '2025-01-01' }, NOW)).toEqual({
      ok: false,
      errors: { scannedOn: 'date' },
    })
    expect(parseScanForm({ weightKg: '70', scannedOn: '29/10/2026' }, NOW)).toEqual({
      ok: false,
      errors: { scannedOn: 'date' },
    })
  })
})

describe('derived values', () => {
  it('works out fat mass and fat % from each other', () => {
    expect(fatMassOf({ weightKg: 80, bfmKg: null, pbf: 25 })).toBe(20)
    expect(fatPercentOf({ weightKg: 80, bfmKg: 20, pbf: null })).toBe(25)
    expect(fatMassOf({ weightKg: 80, bfmKg: null, pbf: null })).toBeNull()
    expect(fatPercentOf({ weightKg: 80, bfmKg: null, pbf: null })).toBeNull()
    expect(fatMassOf({ weightKg: 80, bfmKg: 19, pbf: 25 })).toBe(19)
  })

  it('dates the next scan 30 days later and reads today in Cairo', () => {
    expect(nextScanDue('2026-10-27')).toBe('2026-11-26')
    // 23:30 UTC on the 29th is already the 30th in Cairo.
    expect(cairoDate(new Date('2026-10-29T23:30:00Z'))).toBe('2026-10-30')
  })
})
