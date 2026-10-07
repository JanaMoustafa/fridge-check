'use client'

import { useSyncExternalStore } from 'react'
import { favorites, type Favorite } from '@/lib/storage/favorites'

const serverSnapshot = () => null

/**
 * Saved recipes, synced across tabs. Null until the browser store is read (server render and
 * hydration), so pages can avoid flashing an empty state before the real list appears.
 */
export function useFavorites(): readonly Favorite[] | null {
  return useSyncExternalStore(favorites.subscribe, favorites.list, serverSnapshot)
}

export function useIsFavorite(id: string): boolean {
  const list = useFavorites()
  return list?.some((favorite) => favorite.recipe.id === id) ?? false
}
