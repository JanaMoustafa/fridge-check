import { describe, expect, it } from 'vitest'
import { DEFAULT_SETTINGS, parseSettings, serializeSettings } from './settings'

describe('parseSettings', () => {
  it('returns defaults for missing or unreadable values', () => {
    expect(parseSettings(null)).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('{not json')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('42')).toEqual(DEFAULT_SETTINGS)
    expect(parseSettings('null')).toEqual(DEFAULT_SETTINGS)
  })

  it('reads valid settings', () => {
    expect(parseSettings('{"assumeStaples":false,"units":"imperial"}')).toEqual({
      assumeStaples: false,
      units: 'imperial',
    })
  })

  it('keeps valid fields when others are corrupt', () => {
    expect(parseSettings('{"assumeStaples":false,"units":"cubits"}')).toEqual({
      assumeStaples: false,
      units: 'metric',
    })
    expect(parseSettings('{"assumeStaples":"yes","units":"imperial"}')).toEqual({
      assumeStaples: true,
      units: 'imperial',
    })
  })

  it('round-trips through serialization', () => {
    const settings = { assumeStaples: false, units: 'imperial' as const }
    expect(parseSettings(serializeSettings(settings))).toEqual(settings)
  })

  it('refuses to serialize invalid settings', () => {
    expect(() => serializeSettings({ assumeStaples: true, units: 'cubits' as never })).toThrow()
  })
})
