import { describe, expect, it } from 'vitest'
import type { RecipeDetail, RecipeSummary } from '@/types/recipe'
import { createCollectionStore } from './collection-store'
import {
  createFavorites,
  FavoriteSchema,
  FavoritesImportError,
  MAX_IMPORT_BYTES,
  toFavoriteSnapshot,
} from './favorites'
import { createSafeStorage } from './safe-storage'

const summary = (id: string, patch: Partial<RecipeSummary> = {}): RecipeSummary => ({
  id,
  source: 'local',
  title: `Recipe ${id}`,
  imageUrl: 'https://www.themealdb.com/images/media/meals/x.jpg',
  diets: ['vegetarian', 'pescatarian'],
  dietsEstimated: false,
  usedIngredients: ['egg'],
  missingIngredients: ['milk'],
  matchedUserIngredients: ['egg'],
  matchScore: 0.5,
  ...patch,
})

const detail = (id: string): RecipeDetail => ({
  ...summary(id),
  ingredients: [{ raw: '2 eggs', name: 'egg', amount: 2 }],
  instructions: ['Beat the eggs.'],
  cuisine: 'Egyptian',
  sourceUrl: 'https://example.com/r',
  attribution: 'TheMealDB',
})

function setup(
  times = ['2026-10-01T10:00:00.000Z', '2026-10-02T10:00:00.000Z', '2026-10-03T10:00:00.000Z'],
) {
  const data = new Map<string, string>()
  const storage = createSafeStorage(
    () =>
      ({
        getItem: (k: string) => data.get(k) ?? null,
        setItem: (k: string, v: string) => void data.set(k, v),
        removeItem: (k: string) => void data.delete(k),
      }) as Storage,
  )
  let tick = 0
  const store = createCollectionStore({
    key: 'f',
    itemSchema: FavoriteSchema,
    storage,
    events: undefined,
  })
  return {
    api: createFavorites(store, () => new Date(times[Math.min(tick++, times.length - 1)]!)),
    data,
  }
}

describe('toFavoriteSnapshot', () => {
  it('keeps the recipe but clears search-specific match fields', () => {
    const snapshot = toFavoriteSnapshot(detail('local:1'))
    expect(snapshot).toMatchObject({ title: 'Recipe local:1', ingredients: [{ name: 'egg' }] })
    expect(snapshot.usedIngredients).toEqual([])
    expect(snapshot.matchScore).toBe(0)
  })

  it('keeps only id, title and image for Spoonacular recipes (their terms)', () => {
    const snapshot = toFavoriteSnapshot({ ...detail('spoonacular:9'), source: 'spoonacular' })
    expect(snapshot.ingredients).toBeUndefined()
    expect(snapshot.instructions).toBeUndefined()
    expect(snapshot.diets).toEqual([])
    expect(snapshot).toMatchObject({ id: 'spoonacular:9', title: 'Recipe spoonacular:9' })
  })
})

describe('favorites', () => {
  it('saves, lists newest first, and removes', () => {
    const { api } = setup()
    api.save(summary('local:1'))
    api.save(summary('local:2'))
    expect(api.list().map((f) => f.recipe.id)).toEqual(['local:2', 'local:1'])
    expect(api.has('local:1')).toBe(true)
    api.remove('local:1')
    expect(api.has('local:1')).toBe(false)
  })

  it('does not save the same recipe twice', () => {
    const { api } = setup()
    api.save(summary('local:1'))
    api.save(summary('local:1'))
    expect(api.list()).toHaveLength(1)
  })

  it('toggles', () => {
    const { api } = setup()
    expect(api.toggle(summary('local:1'))).toBe(true)
    expect(api.toggle(summary('local:1'))).toBe(false)
    expect(api.list()).toEqual([])
  })

  it('upgrades a card snapshot with details, keeping when it was saved', () => {
    const { api } = setup()
    api.save(summary('local:1'))
    const savedAt = api.list()[0]!.savedAt
    api.upgrade(detail('local:1'))
    api.upgrade(detail('local:404'))
    expect(api.list()).toHaveLength(1)
    expect(api.list()[0]).toMatchObject({ savedAt, recipe: { instructions: ['Beat the eggs.'] } })
  })

  it('exports and imports, merging by id (newest wins)', () => {
    const a = setup()
    a.api.save(detail('local:1'))
    a.api.save(detail('local:2'))
    const exported = a.api.exportJson()

    const b = setup(['2026-09-01T10:00:00.000Z', '2026-12-01T10:00:00.000Z'])
    b.api.save(summary('local:1')) // older than the export's copy
    b.api.save(summary('local:3')) // newer, not in the export
    expect(b.api.importJson(exported)).toEqual({ added: 1, updated: 1, invalid: 0 })
    expect(
      b.api
        .list()
        .map((f) => f.recipe.id)
        .sort(),
    ).toEqual(['local:1', 'local:2', 'local:3'])
    expect(b.api.list().find((f) => f.recipe.id === 'local:1')?.recipe.instructions).toEqual([
      'Beat the eggs.',
    ])
  })

  it('skips invalid entries in an import and reports them', () => {
    const { api } = setup()
    const file = JSON.stringify({
      app: 'fridge-check',
      kind: 'favorites',
      version: 1,
      items: [
        { savedAt: '2026-10-01T10:00:00.000Z', recipe: toFavoriteSnapshot(summary('local:7')) },
        { nope: true },
      ],
    })
    expect(api.importJson(file)).toEqual({ added: 1, updated: 0, invalid: 1 })
  })

  it('keeps an existing newer entry over an older imported one', () => {
    const { api } = setup(['2026-12-01T10:00:00.000Z'])
    api.save(summary('local:1'))
    const file = JSON.stringify({
      app: 'fridge-check',
      kind: 'favorites',
      version: 1,
      items: [
        { savedAt: '2026-01-01T10:00:00.000Z', recipe: toFavoriteSnapshot(summary('local:1')) },
      ],
    })
    expect(api.importJson(file)).toEqual({ added: 0, updated: 0, invalid: 0 })
  })

  it.each([
    ['not JSON', '{oops', 'unreadable'],
    ['another app’s file', JSON.stringify({ items: [] }), 'unreadable'],
    ['a file that is too large', ' '.repeat(MAX_IMPORT_BYTES + 1), 'too-large'],
  ])('refuses %s', (_label, text, reason) => {
    const { api } = setup()
    expect(() => api.importJson(text)).toThrow(FavoritesImportError)
    try {
      api.importJson(text)
    } catch (error) {
      expect((error as FavoritesImportError).reason).toBe(reason)
    }
  })
})
