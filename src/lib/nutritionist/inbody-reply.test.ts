import { describe, expect, it } from 'vitest'
import { INBODY_PROMPT, parseInbodyReply } from './inbody-reply'

describe('parseInbodyReply', () => {
  it('turns a full reply into form values', () => {
    const reply =
      'Here you go: {"isInBody": true, "scannedOn": "2026-10-27", "weightKg": 68.04, "smmKg": 24.1, "bfmKg": 22.6, "pbf": 33.2, "bmrKcal": 1360, "vfl": 8, "tbwL": 33.2}'
    expect(parseInbodyReply(reply)).toEqual({
      isInBody: true,
      found: 7,
      values: {
        scannedOn: '2026-10-27',
        weightKg: '68',
        smmKg: '24.1',
        bfmKg: '22.6',
        pbf: '33.2',
        bmrKcal: '1360',
        vfl: '8',
        tbwL: '33.2',
      },
    })
  })

  it('leaves out anything missing, implausible or malformed', () => {
    expect(
      parseInbodyReply(
        '{"isInBody": true, "scannedOn": "27/10/2026", "weightKg": 68, "pbf": 120, "bmrKcal": null, "vfl": "eight"}',
      ),
    ).toEqual({
      isInBody: true,
      found: 1,
      values: {
        scannedOn: '',
        weightKg: '68',
        smmKg: '',
        bfmKg: '',
        pbf: '',
        bmrKcal: '',
        vfl: '',
        tbwL: '',
      },
    })
  })

  it('reports a photo that is not an InBody sheet, and replies without JSON', () => {
    expect(parseInbodyReply('{"isInBody": false, "weightKg": null}')).toMatchObject({
      isInBody: false,
      found: 0,
    })
    expect(parseInbodyReply('I cannot read this image.')).toBeNull()
    expect(parseInbodyReply('{not json}')).toBeNull()
    expect(parseInbodyReply('[1, 2]')).toBeNull()
  })

  it('asks for every field the form has, and never for a guess', () => {
    for (const key of [
      'weightKg',
      'smmKg',
      'bfmKg',
      'pbf',
      'bmrKcal',
      'vfl',
      'tbwL',
      'scannedOn',
    ]) {
      expect(INBODY_PROMPT).toContain(`"${key}"`)
    }
    expect(INBODY_PROMPT).toMatch(/never estimate/)
  })
})
