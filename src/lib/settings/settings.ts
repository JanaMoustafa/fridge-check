import { z } from 'zod'

export const SETTINGS_STORAGE_KEY = 'fc:settings:v1'

export const UnitSystemSchema = z.enum(['metric', 'imperial'])
export type UnitSystem = z.infer<typeof UnitSystemSchema>

export const SettingsSchema = z.object({
  /** "Assume I have basic staples" (spec default ON). */
  assumeStaples: z.boolean(),
  /** How converted quantities are shown, where the data allows (spec 7.6). */
  units: UnitSystemSchema,
})
export type Settings = z.infer<typeof SettingsSchema>

export const DEFAULT_SETTINGS: Settings = Object.freeze({ assumeStaples: true, units: 'metric' })

/**
 * Settings from storage, field by field: a corrupt or partial value keeps every valid field and
 * falls back to the default for the rest, instead of resetting everything.
 */
export function parseSettings(raw: string | null): Settings {
  if (!raw) return DEFAULT_SETTINGS
  let value: unknown
  try {
    value = JSON.parse(raw)
  } catch {
    return DEFAULT_SETTINGS
  }
  if (typeof value !== 'object' || value === null) return DEFAULT_SETTINGS
  const record = value as Record<string, unknown>
  const staples = SettingsSchema.shape.assumeStaples.safeParse(record.assumeStaples)
  const units = UnitSystemSchema.safeParse(record.units)
  return {
    assumeStaples: staples.success ? staples.data : DEFAULT_SETTINGS.assumeStaples,
    units: units.success ? units.data : DEFAULT_SETTINGS.units,
  }
}

export function serializeSettings(settings: Settings): string {
  return JSON.stringify(SettingsSchema.parse(settings))
}
