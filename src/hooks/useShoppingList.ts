'use client'

import { useSyncExternalStore } from 'react'
import { shoppingList, type ShoppingItem } from '@/lib/storage/shopping-list'

const serverSnapshot = () => null

/** Shopping list items, synced across tabs; null until the browser store is read. */
export function useShoppingList(): readonly ShoppingItem[] | null {
  return useSyncExternalStore(shoppingList.subscribe, shoppingList.items, serverSnapshot)
}
