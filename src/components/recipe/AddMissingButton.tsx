'use client'

import { ListPlus } from 'lucide-react'
import Link from 'next/link'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import { buttonClasses } from '@/components/ui/button'
import { useSettings } from '@/hooks/useSettings'
import { shoppingList, type ShoppingItem } from '@/lib/storage/shopping-list'

type Status =
  | { kind: 'added'; entries: ShoppingItem[] }
  | { kind: 'already' }
  | { kind: 'nothing' }
  | { kind: 'undone' }

/** "Add missing to shopping list", with Undo. Staples follow the reader's setting. */
export function AddMissingButton({
  recipe,
  withStaples,
  withoutStaples,
}: {
  recipe: { id: string; title: string }
  withStaples: readonly string[]
  withoutStaples: readonly string[]
}) {
  const t = useTranslations('shopping')
  const announce = useAnnounce()
  const { settings } = useSettings()
  const [status, setStatus] = useState<Status | null>(null)
  const missing = settings.assumeStaples ? withStaples : withoutStaples

  function report(next: Status, message: string) {
    setStatus(next)
    announce(message)
  }

  function add() {
    if (missing.length === 0) return report({ kind: 'nothing' }, t('nothingMissing'))
    const entries = shoppingList.addFromRecipe(recipe, missing)
    if (entries.length === 0) return report({ kind: 'already' }, t('alreadyAdded'))
    report({ kind: 'added', entries }, t('addedCount', { count: entries.length }))
  }

  function undo(entries: ShoppingItem[]) {
    shoppingList.removeEntries(entries)
    report({ kind: 'undone' }, t('undone'))
  }

  return (
    <div className="space-y-2 print:hidden">
      <button type="button" onClick={add} className={buttonClasses()}>
        <ListPlus aria-hidden="true" className="size-4" />
        {t('addMissing')}
      </button>
      {status && (
        <p className="flex flex-wrap items-center gap-x-3 text-sm text-fg-muted">
          {status.kind === 'added' && (
            <>
              {t('addedCount', { count: status.entries.length })}
              <button
                type="button"
                onClick={() => undo(status.entries)}
                className="min-h-11 font-semibold text-primary underline underline-offset-4"
              >
                {t('undo')}
              </button>
              <Link
                href="/shopping-list"
                transitionTypes={['nav-tab']}
                className="min-h-11 content-center font-semibold text-primary underline underline-offset-4"
              >
                {t('viewList')}
              </Link>
            </>
          )}
          {status.kind === 'already' && t('alreadyAdded')}
          {status.kind === 'nothing' && t('nothingMissing')}
          {status.kind === 'undone' && t('undone')}
        </p>
      )}
    </div>
  )
}
