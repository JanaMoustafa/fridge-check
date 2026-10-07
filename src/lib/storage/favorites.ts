import { z } from 'zod'
import {
  IngredientSchema,
  RecipeSummarySchema,
  type RecipeDetail,
  type RecipeSummary,
} from '@/types/recipe'
import { createCollectionStore, type CollectionStore } from './collection-store'
import { localStore } from './safe-storage'

export const FAVORITES_KEY = 'fc:favorites:v1'
/** Import files larger than this are refused (a favorites export is a few hundred KB at most). */
export const MAX_IMPORT_BYTES = 1_000_000

/**
 * A saved recipe: a snapshot so favorites work offline and survive API quota exhaustion. Detail
 * fields are optional because a card can be saved before its details are fetched, and because
 * Spoonacular's terms only allow keeping id, title and image.
 */
export const FavoriteRecipeSchema = RecipeSummarySchema.safeExtend({
  ingredients: z.array(IngredientSchema).min(1).optional(),
  instructions: z.array(z.string().trim().min(1)).min(1).optional(),
  cuisine: z.string().min(1).optional(),
  sourceUrl: z.url({ protocol: /^https?$/ }).optional(),
  attribution: z.string().min(1).optional(),
})
export type FavoriteRecipe = z.infer<typeof FavoriteRecipeSchema>

export const FavoriteSchema = z.object({
  savedAt: z.iso.datetime(),
  recipe: FavoriteRecipeSchema,
})
export type Favorite = z.infer<typeof FavoriteSchema>

/**
 * What is stored for a recipe. Match fields describe one search, not the recipe, so they are
 * cleared; Spoonacular recipes keep only what their terms allow (id, title, image).
 */
export function toFavoriteSnapshot(recipe: RecipeSummary | RecipeDetail): FavoriteRecipe {
  const base = {
    id: recipe.id,
    source: recipe.source,
    title: recipe.title,
    imageUrl: recipe.imageUrl,
    diets: [],
    dietsEstimated: true,
    usedIngredients: [],
    missingIngredients: [],
    matchedUserIngredients: [],
    matchScore: 0,
  }
  if (recipe.source === 'spoonacular') return base
  const detail = recipe as Partial<RecipeDetail>
  return {
    ...base,
    diets: [...recipe.diets],
    dietsEstimated: recipe.dietsEstimated,
    readyInMinutes: recipe.readyInMinutes,
    servings: recipe.servings,
    ingredients: detail.ingredients?.map((ingredient) => ({ ...ingredient })),
    instructions: detail.instructions && [...detail.instructions],
    cuisine: detail.cuisine,
    sourceUrl: detail.sourceUrl,
    attribution: detail.attribution,
  }
}

export interface ImportResult {
  added: number
  updated: number
  invalid: number
}

export class FavoritesImportError extends Error {
  constructor(readonly reason: 'too-large' | 'unreadable') {
    super(`Favorites import failed: ${reason}`)
    this.name = 'FavoritesImportError'
  }
}

const ExportFileSchema = z.object({
  app: z.literal('fridge-check'),
  kind: z.literal('favorites'),
  version: z.literal(1),
  items: z.array(z.unknown()),
})

export function createFavorites(
  store: CollectionStore<Favorite>,
  now: () => Date = () => new Date(),
) {
  const list = () => store.getAll()
  const has = (id: string) => list().some((favorite) => favorite.recipe.id === id)

  function save(recipe: RecipeSummary | RecipeDetail): boolean {
    if (has(recipe.id)) return true
    const entry: Favorite = { savedAt: now().toISOString(), recipe: toFavoriteSnapshot(recipe) }
    return store.setAll([entry, ...list()])
  }

  function remove(id: string): boolean {
    return store.setAll(list().filter((favorite) => favorite.recipe.id !== id))
  }

  return {
    list,
    has,
    save,
    remove,
    subscribe: store.subscribe,
    /** Saves or unsaves; returns whether the recipe is saved afterwards. */
    toggle(recipe: RecipeSummary | RecipeDetail): boolean {
      if (has(recipe.id)) {
        remove(recipe.id)
        return false
      }
      save(recipe)
      return true
    },
    /** Replaces a saved snapshot with fuller details, keeping when it was saved. */
    upgrade(detail: RecipeDetail): void {
      if (!has(detail.id)) return
      store.update((items) =>
        items.map((favorite) =>
          favorite.recipe.id === detail.id
            ? { ...favorite, recipe: toFavoriteSnapshot(detail) }
            : favorite,
        ),
      )
    },
    exportJson(): string {
      return `${JSON.stringify({ app: 'fridge-check', kind: 'favorites', version: 1, items: list() }, null, 2)}\n`
    },
    /** Merges an export into the current favorites by id; the more recently saved entry wins. */
    importJson(text: string): ImportResult {
      if (new Blob([text]).size > MAX_IMPORT_BYTES) throw new FavoritesImportError('too-large')
      let file: z.infer<typeof ExportFileSchema>
      try {
        file = ExportFileSchema.parse(JSON.parse(text))
      } catch {
        throw new FavoritesImportError('unreadable')
      }
      const merged = new Map(list().map((favorite) => [favorite.recipe.id, favorite]))
      const result: ImportResult = { added: 0, updated: 0, invalid: 0 }
      for (const item of file.items) {
        const parsed = FavoriteSchema.safeParse(item)
        if (!parsed.success) {
          result.invalid++
          continue
        }
        const incoming = { ...parsed.data, recipe: toFavoriteSnapshot(parsed.data.recipe) }
        const current = merged.get(incoming.recipe.id)
        if (!current) result.added++
        else if (incoming.savedAt > current.savedAt) result.updated++
        else continue
        merged.set(incoming.recipe.id, incoming)
      }
      store.setAll([...merged.values()].sort((a, b) => b.savedAt.localeCompare(a.savedAt)))
      return result
    },
  }
}

export type FavoritesApi = ReturnType<typeof createFavorites>

export const favorites = createFavorites(
  createCollectionStore({ key: FAVORITES_KEY, itemSchema: FavoriteSchema, storage: localStore }),
)
