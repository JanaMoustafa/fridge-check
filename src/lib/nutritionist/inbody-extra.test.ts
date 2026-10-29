import { describe, expect, it } from 'vitest'
import { EXTRA_FIELD_NAMES, ExtraSchema, parseExtraJson } from './inbody-extra'

describe('InBody extras', () => {
  it('keeps known numbers within range and drops the rest', () => {
    expect(
      ExtraSchema.parse({ bmi: 25.04, inbodyScore: 71, whr: 0.88, smi: 99, nonsense: 1, age: 'x' }),
    ).toEqual({ bmi: 25.04, inbodyScore: 71, whr: 0.88 })
  })

  it('reads the form field, and gives nothing for junk', () => {
    expect(parseExtraJson('{"leanTrunkKg":19.8,"weightControlKg":-9}')).toEqual({
      leanTrunkKg: 19.8,
      weightControlKg: -9,
    })
    expect(parseExtraJson(undefined)).toEqual({})
    expect(parseExtraJson('not json')).toEqual({})
    expect(parseExtraJson('[1,2]')).toEqual({})
    expect(parseExtraJson('{"bmi":"25"}')).toEqual({})
  })

  it('has a translation for every field', async () => {
    const en = (await import('../../../messages/en.json')).default as {
      nutritionist: { extras: Record<string, string> }
    }
    for (const name of EXTRA_FIELD_NAMES) expect(en.nutritionist.extras[name], name).toBeTruthy()
  })
})
