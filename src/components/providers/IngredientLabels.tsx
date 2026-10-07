'use client'

import { useLocale } from 'next-intl'
import { createContext, useCallback, useContext, type ReactNode } from 'react'
import { ingredientLabel, type IngredientNameTable } from '@/lib/i18n/ingredient-names'

const LabelsContext = createContext<IngredientNameTable | undefined>(undefined)

/** The Arabic names table comes from the server (only in Arabic), so chips never flash English. */
export function IngredientLabelsProvider({
  names,
  children,
}: {
  names: IngredientNameTable | undefined
  children: ReactNode
}) {
  return <LabelsContext value={names}>{children}</LabelsContext>
}

/** The Arabic names table when the UI is in Arabic (undefined in English). */
export function useIngredientNames() {
  return useContext(LabelsContext)
}

/** canonical name → label in the current language. */
export function useIngredientLabel() {
  const locale = useLocale()
  const names = useContext(LabelsContext)
  return useCallback(
    (canonical: string) => ingredientLabel(canonical, locale, names),
    [locale, names],
  )
}
