'use client'

import { Check, Copy, ReceiptText, Share2 } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { ToggleGroup } from 'radix-ui'
import { useId, useState } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import { useIngredientLabel } from '@/components/providers/IngredientLabels'
import { buttonClasses } from '@/components/ui/button'
import { EmptyState } from '@/components/ui/EmptyState'
import { useShoppingList } from '@/hooks/useShoppingList'
import { cx } from '@/lib/cx'
import { localStore } from '@/lib/storage/safe-storage'
import { combine, groupByRecipe, shoppingList, shoppingListText } from '@/lib/storage/shopping-list'

type Mode = 'combined' | 'by-recipe'
const MODE_KEY = 'fc:shopping-view'

function readMode(): Mode {
  return localStore.get(MODE_KEY) === 'by-recipe' ? 'by-recipe' : 'combined'
}

export function ShoppingListView() {
  const t = useTranslations('shopping')
  const label = useIngredientLabel()
  const announce = useAnnounce()
  const items = useShoppingList()
  const [mode, setMode] = useState<Mode>(readMode)
  const [message, setMessage] = useState<string | null>(null)
  const viewLabelId = useId()

  if (items === null) return <div className="min-h-64" aria-busy="true" />
  if (items.length === 0) {
    return (
      <EmptyState
        icon={ReceiptText}
        title={t('emptyTitle')}
        body={t('emptyBody')}
        action={{ href: '/', label: t('emptyCta') }}
      />
    )
  }

  const combined = combine(items)
  const remaining = combined.filter((item) => !item.checked).length
  const anyChecked = items.some((item) => item.checked)
  const text = () => shoppingListText({ items, mode, label, heading: t('heading') })

  function report(next: string) {
    setMessage(next)
    announce(next)
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(text())
      report(t('copied'))
    } catch {
      report(t('copyFailed'))
    }
  }

  async function share() {
    try {
      await navigator.share({ title: t('heading'), text: text() })
    } catch (error) {
      if (!(error instanceof DOMException && error.name === 'AbortError')) await copy()
    }
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span id={viewLabelId} className="text-sm font-semibold">
            {t('viewLabel')}
          </span>
          <ToggleGroup.Root
            type="single"
            value={mode}
            onValueChange={(value) => {
              if (value !== 'combined' && value !== 'by-recipe') return
              setMode(value)
              localStore.set(MODE_KEY, value)
            }}
            aria-labelledby={viewLabelId}
            className="flex rounded-full border border-line-strong bg-surface p-0.5"
          >
            {(['combined', 'by-recipe'] as const).map((value) => (
              <ToggleGroup.Item
                key={value}
                value={value}
                className="min-h-11 rounded-full px-4 text-sm font-semibold text-fg-muted data-[state=on]:bg-primary data-[state=on]:text-on-primary"
              >
                {t(value === 'combined' ? 'combined' : 'byRecipe')}
              </ToggleGroup.Item>
            ))}
          </ToggleGroup.Root>
        </div>
        <p className="text-sm font-semibold text-fg-muted tabular-nums" aria-live="polite">
          {t('remaining', { count: remaining })}
        </p>
      </div>

      <div className="receipt mx-auto max-w-xl rounded-t-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] sm:p-7">
        <p className="mb-3 border-b-2 border-dashed border-line pb-3 text-center text-sm font-extrabold tracking-wide text-fg-muted uppercase">
          {t('heading')}
        </p>
        {mode === 'combined' ? (
          <ul className="divide-y divide-dashed divide-line">
            {combined.map((item) => (
              <ItemRow
                key={item.name}
                label={label(item.name)}
                checked={item.checked}
                detail={t('usedIn', { recipes: item.recipes.join(', ') })}
                onChange={(checked) => shoppingList.setChecked(item.name, checked)}
              />
            ))}
          </ul>
        ) : (
          <div className="space-y-5">
            {groupByRecipe(items).map((group) => (
              <section key={group.recipeId} aria-label={group.recipeTitle}>
                <h2 lang="en" dir="ltr" className="mb-1 text-start font-bold">
                  {group.recipeTitle}
                </h2>
                <ul className="divide-y divide-dashed divide-line">
                  {group.items.map((item) => (
                    <ItemRow
                      key={item.name}
                      label={label(item.name)}
                      checked={item.checked}
                      onChange={(checked) =>
                        shoppingList.setChecked(item.name, checked, group.recipeId)
                      }
                    />
                  ))}
                </ul>
              </section>
            ))}
          </div>
        )}
      </div>

      <div className="mx-auto flex max-w-xl flex-wrap gap-2 print:hidden">
        <button
          type="button"
          onClick={() => void copy()}
          className={buttonClasses({ variant: 'secondary' })}
        >
          <Copy aria-hidden="true" className="size-4" />
          {t('copy')}
        </button>
        {typeof navigator !== 'undefined' && typeof navigator.share === 'function' && (
          <button
            type="button"
            onClick={() => void share()}
            className={buttonClasses({ variant: 'secondary' })}
          >
            <Share2 aria-hidden="true" className="size-4" />
            {t('share')}
          </button>
        )}
        <button
          type="button"
          disabled={!anyChecked}
          onClick={() => shoppingList.clearChecked()}
          className={buttonClasses({ variant: 'ghost', className: 'text-danger' })}
        >
          {t('clearChecked')}
        </button>
        {message && <p className="w-full text-sm text-fg-muted">{message}</p>}
      </div>
    </div>
  )
}

function ItemRow({
  label,
  checked,
  detail,
  onChange,
}: {
  label: string
  checked: boolean
  detail?: string
  onChange: (checked: boolean) => void
}) {
  const id = useId()
  return (
    <li className="flex items-start gap-3 py-2.5">
      <span className="relative mt-0.5 grid size-6 shrink-0 place-items-center">
        <input
          id={id}
          type="checkbox"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer size-6 cursor-pointer appearance-none rounded-[6px] border-2 border-line-strong bg-surface transition-colors before:absolute before:-inset-2.5 before:content-[''] checked:border-have checked:bg-have"
        />
        <Check
          aria-hidden="true"
          strokeWidth={3.5}
          className="pointer-events-none absolute size-4 text-surface opacity-0 peer-checked:opacity-100"
        />
      </span>
      <label htmlFor={id} className="min-w-0 flex-1 cursor-pointer">
        <span
          dir="auto"
          className={cx('font-semibold', checked && 'text-fg-muted line-through decoration-2')}
        >
          {label}
        </span>
        {detail && (
          <span dir="auto" className="block text-xs text-fg-muted">
            {detail}
          </span>
        )}
      </label>
    </li>
  )
}
