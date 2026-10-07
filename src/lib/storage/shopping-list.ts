import { z } from 'zod'
import { CanonicalNameSchema } from '@/types/recipe'
import { createCollectionStore, type CollectionStore } from './collection-store'
import { localStore } from './safe-storage'

export const SHOPPING_KEY = 'fc:shopping:v1'

/** One missing ingredient, remembered with the recipe it came from. */
export const ShoppingItemSchema = z.object({
  name: CanonicalNameSchema,
  recipeId: z.string().min(1),
  recipeTitle: z.string().trim().min(1),
  checked: z.boolean(),
  addedAt: z.iso.datetime(),
})
export type ShoppingItem = z.infer<typeof ShoppingItemSchema>

export interface CombinedItem {
  name: string
  /** Checked only when every recipe's entry for this ingredient is checked. */
  checked: boolean
  recipes: string[]
}

export interface RecipeGroup {
  recipeId: string
  recipeTitle: string
  items: ShoppingItem[]
}

/** Deduplicated by canonical name, in the order first added. */
export function combine(items: readonly ShoppingItem[]): CombinedItem[] {
  const byName = new Map<string, CombinedItem>()
  for (const item of items) {
    const current = byName.get(item.name)
    if (current) {
      current.checked &&= item.checked
      if (!current.recipes.includes(item.recipeTitle)) current.recipes.push(item.recipeTitle)
    } else {
      byName.set(item.name, { name: item.name, checked: item.checked, recipes: [item.recipeTitle] })
    }
  }
  return [...byName.values()]
}

export function groupByRecipe(items: readonly ShoppingItem[]): RecipeGroup[] {
  const groups = new Map<string, RecipeGroup>()
  for (const item of items) {
    const group = groups.get(item.recipeId)
    if (group) group.items.push(item)
    else
      groups.set(item.recipeId, {
        recipeId: item.recipeId,
        recipeTitle: item.recipeTitle,
        items: [item],
      })
  }
  return [...groups.values()]
}

/**
 * Plain-text list for copy/share. Unicode isolates keep English recipe titles and Arabic labels
 * in the right order when pasted into another app.
 */
export function shoppingListText({
  items,
  mode,
  label,
  heading,
}: {
  items: readonly ShoppingItem[]
  mode: 'combined' | 'by-recipe'
  label: (name: string) => string
  heading: string
}): string {
  const line = (name: string, checked: boolean) => `${checked ? '☑' : '☐'} ⁨${label(name)}⁩`
  const body =
    mode === 'combined'
      ? combine(items).map((item) => line(item.name, item.checked))
      : groupByRecipe(items).flatMap((group) => [
          '',
          `⁨${group.recipeTitle}⁩`,
          ...group.items.map((item) => line(item.name, item.checked)),
        ])
  return [heading, ...body].join('\n').trim()
}

export function createShoppingList(
  store: CollectionStore<ShoppingItem>,
  now: () => Date = () => new Date(),
) {
  const items = () => store.getAll()

  return {
    items,
    subscribe: store.subscribe,
    /** Adds a recipe's missing ingredients; returns the entries actually added (for undo). */
    addFromRecipe(recipe: { id: string; title: string }, names: readonly string[]): ShoppingItem[] {
      const existing = new Set(
        items()
          .filter((item) => item.recipeId === recipe.id)
          .map((item) => item.name),
      )
      const addedAt = now().toISOString()
      const added = [...new Set(names)]
        .filter((name) => !existing.has(name))
        .map((name) => ({
          name,
          recipeId: recipe.id,
          recipeTitle: recipe.title,
          checked: false,
          addedAt,
        }))
      if (added.length > 0) store.setAll([...items(), ...added])
      return added
    },
    /** Removes exactly these entries (undo of an add). */
    removeEntries(entries: ReadonlyArray<Pick<ShoppingItem, 'name' | 'recipeId'>>): void {
      const keys = new Set(entries.map((entry) => `${entry.recipeId}\u0000${entry.name}`))
      store.update((list) => list.filter((item) => !keys.has(`${item.recipeId}\u0000${item.name}`)))
    },
    /** Checks one recipe's entry, or every entry with that name when no recipe is given. */
    setChecked(name: string, checked: boolean, recipeId?: string): void {
      store.update((list) =>
        list.map((item) =>
          item.name === name && (recipeId === undefined || item.recipeId === recipeId)
            ? { ...item, checked }
            : item,
        ),
      )
    },
    clearChecked(): void {
      store.update((list) => list.filter((item) => !item.checked))
    },
    clearAll(): void {
      store.setAll([])
    },
  }
}

export type ShoppingListApi = ReturnType<typeof createShoppingList>

export const shoppingList = createShoppingList(
  createCollectionStore({ key: SHOPPING_KEY, itemSchema: ShoppingItemSchema, storage: localStore }),
)
