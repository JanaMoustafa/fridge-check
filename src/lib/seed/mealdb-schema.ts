import { z } from 'zod'

/**
 * TheMealDB API responses, as the seed script reads them. Only the fields the seed uses are
 * validated; everything else in a record is dropped. Text fields are nullish throughout because
 * TheMealDB sends null, "" and " " interchangeably for "nothing".
 */

/** Each meal has 20 numbered ingredient slots: strIngredient1…20 with a matching strMeasure. */
export const INGREDIENT_SLOTS = 20

const MealDbIdSchema = z.string().regex(/^\d+$/)
const TextSchema = z.string().nullish()

type SlotField = `strIngredient${number}` | `strMeasure${number}`

const slotShape = {} as Record<SlotField, typeof TextSchema>
for (let slot = 1; slot <= INGREDIENT_SLOTS; slot++) {
  slotShape[`strIngredient${slot}`] = TextSchema
  slotShape[`strMeasure${slot}`] = TextSchema
}

/** One full meal record (search.php and lookup.php). */
export const MealDbMealSchema = z.object({
  ...slotShape,
  idMeal: MealDbIdSchema,
  strMeal: z.string(),
  strCategory: TextSchema,
  /** Null on ~190 meals; strCountry is always set, so the seed uses that. */
  strArea: TextSchema,
  strCountry: TextSchema,
  strInstructions: TextSchema,
  strMealThumb: TextSchema,
  strSource: TextSchema,
})
/** The schema validates the 40 slot fields too; TypeScript just cannot infer computed keys. */
export type MealDbMeal = z.infer<typeof MealDbMealSchema> &
  Partial<Record<SlotField, string | null>>

/** One entry of filter.php?c=<category>: enough to know the meal exists. */
export const MealDbFilterEntrySchema = z.object({ idMeal: MealDbIdSchema, strMeal: z.string() })
export type MealDbFilterEntry = z.infer<typeof MealDbFilterEntrySchema>

/** One entry of list.php?c=list. */
export const MealDbCategorySchema = z.object({ strCategory: z.string().trim().min(1) })

/**
 * `meals` is an array, null (no results), a string ("Invalid ID", "no data found") or a Patreon
 * notice object. Anything else, or no `meals` at all, is not a TheMealDB answer.
 */
const EnvelopeSchema = z.object({
  meals: z.union([z.array(z.unknown()), z.null(), z.string(), z.looseObject({})]),
})

export interface MealsField<T> {
  /** The records that passed validation, in response order. */
  items: T[]
  /** One line per record that failed validation: its index, its id when it has one, and why. */
  invalid: string[]
  /**
   * Set when `meals` was not an array: TheMealDB answers "Invalid ID", "no data found" or a
   * Patreon notice object instead of an error status. null (no results) is not a notice.
   */
  notice?: string
}

function describeNotice(value: string | object): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

function describeInvalid(record: unknown, index: number, error: z.ZodError): string {
  const id = (record as { idMeal?: unknown } | null)?.idMeal
  const label = `#${index}${typeof id === 'string' ? ` (${id})` : ''}`
  const issues = error.issues.map((issue) =>
    issue.path.length === 0 ? issue.message : `${issue.path.join('.')}: ${issue.message}`,
  )
  return `${label} ${issues.join('; ')}`
}

/**
 * Reads the polymorphic `meals` field of any TheMealDB response. Anything but an array counts as
 * no records (with a notice saying what it was); each array entry is validated on its own, so one
 * malformed record is reported instead of failing the whole response. Throws when the body is not
 * a TheMealDB answer at all, so the caller can retry or stop.
 */
export function parseMealsField<T>(json: unknown, item: z.ZodType<T>): MealsField<T> {
  const envelope = EnvelopeSchema.safeParse(json)
  if (!envelope.success) {
    throw new Error(`Not a TheMealDB response: ${z.prettifyError(envelope.error)}`)
  }
  const { meals } = envelope.data
  if (meals === null) return { items: [], invalid: [] }
  if (!Array.isArray(meals)) return { items: [], invalid: [], notice: describeNotice(meals) }
  const items: T[] = []
  const invalid: string[] = []
  meals.forEach((record: unknown, index) => {
    const result = item.safeParse(record)
    if (result.success) items.push(result.data)
    else invalid.push(describeInvalid(record, index, result.error))
  })
  return { items, invalid }
}

/** One filled ingredient slot, trimmed. */
export interface MealDbLine {
  slot: number
  /** "" when the slot has a measure but no ingredient (the seed reports and drops these). */
  ingredient: string
  measure: string
}

/** The meal's filled ingredient slots in order; slots with neither text are skipped. */
export function ingredientLines(meal: MealDbMeal): MealDbLine[] {
  const lines: MealDbLine[] = []
  for (let slot = 1; slot <= INGREDIENT_SLOTS; slot++) {
    const ingredient = meal[`strIngredient${slot}`]?.trim() ?? ''
    const measure = meal[`strMeasure${slot}`]?.trim() ?? ''
    if (ingredient !== '' || measure !== '') lines.push({ slot, ingredient, measure })
  }
  return lines
}
