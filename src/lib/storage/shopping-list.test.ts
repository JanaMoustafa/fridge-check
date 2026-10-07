import { describe, expect, it } from 'vitest'
import { createCollectionStore } from './collection-store'
import { createSafeStorage } from './safe-storage'
import {
  combine,
  createShoppingList,
  groupByRecipe,
  ShoppingItemSchema,
  shoppingListText,
  type ShoppingItem,
} from './shopping-list'

function setup() {
  const storage = createSafeStorage(() => null)
  const store = createCollectionStore({
    key: 's',
    itemSchema: ShoppingItemSchema,
    storage,
    events: undefined,
  })
  return createShoppingList(store, () => new Date('2026-10-07T12:00:00.000Z'))
}

const koshari = { id: 'local:53027', title: 'Koshari' }
const fatteh = { id: 'local:53031', title: 'Egyptian Fatteh' }

describe('shopping list', () => {
  it('adds a recipe’s missing ingredients once per recipe and returns what was added', () => {
    const list = setup()
    expect(
      list.addFromRecipe(koshari, ['chickpea', 'macaroni', 'chickpea']).map((i) => i.name),
    ).toEqual(['chickpea', 'macaroni'])
    expect(list.addFromRecipe(koshari, ['chickpea', 'coriander']).map((i) => i.name)).toEqual([
      'coriander',
    ])
    expect(list.addFromRecipe(koshari, ['chickpea'])).toEqual([])
    expect(list.items()).toHaveLength(3)
  })

  it('undoes an add by removing exactly those entries', () => {
    const list = setup()
    list.addFromRecipe(fatteh, ['rice'])
    const added = list.addFromRecipe(koshari, ['rice', 'macaroni'])
    list.removeEntries(added)
    expect(list.items().map((i) => [i.recipeId, i.name])).toEqual([['local:53031', 'rice']])
  })

  it('checks per recipe or across recipes, and clears checked items', () => {
    const list = setup()
    list.addFromRecipe(koshari, ['rice', 'macaroni'])
    list.addFromRecipe(fatteh, ['rice'])
    list.setChecked('rice', true, koshari.id)
    expect(combine(list.items()).find((i) => i.name === 'rice')?.checked).toBe(false)
    list.setChecked('rice', true)
    expect(combine(list.items()).find((i) => i.name === 'rice')?.checked).toBe(true)
    list.clearChecked()
    expect(list.items().map((i) => i.name)).toEqual(['macaroni'])
    list.clearAll()
    expect(list.items()).toEqual([])
  })
})

const items: ShoppingItem[] = [
  {
    name: 'rice',
    recipeId: 'a',
    recipeTitle: 'Koshari',
    checked: false,
    addedAt: '2026-10-07T12:00:00.000Z',
  },
  {
    name: 'onion',
    recipeId: 'a',
    recipeTitle: 'Koshari',
    checked: true,
    addedAt: '2026-10-07T12:00:00.000Z',
  },
  {
    name: 'rice',
    recipeId: 'b',
    recipeTitle: 'Fatteh',
    checked: true,
    addedAt: '2026-10-07T12:00:00.000Z',
  },
]

describe('views', () => {
  it('combines by ingredient, deduplicated', () => {
    expect(combine(items)).toEqual([
      { name: 'rice', checked: false, recipes: ['Koshari', 'Fatteh'] },
      { name: 'onion', checked: true, recipes: ['Koshari'] },
    ])
  })

  it('groups by recipe', () => {
    expect(groupByRecipe(items).map((g) => [g.recipeTitle, g.items.length])).toEqual([
      ['Koshari', 2],
      ['Fatteh', 1],
    ])
  })

  it('renders plain text for both views with bidi isolates', () => {
    const label = (name: string) => name.toUpperCase()
    expect(shoppingListText({ items, mode: 'combined', label, heading: 'List' })).toBe(
      'List\n☐ ⁨RICE⁩\n☑ ⁨ONION⁩',
    )
    expect(shoppingListText({ items, mode: 'by-recipe', label, heading: 'List' })).toBe(
      'List\n\n⁨Koshari⁩\n☐ ⁨RICE⁩\n☑ ⁨ONION⁩\n\n⁨Fatteh⁩\n☑ ⁨RICE⁩',
    )
  })
})
