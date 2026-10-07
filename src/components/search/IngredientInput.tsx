'use client'

import { X } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { Tooltip } from 'radix-ui'
import { useEffect, useId, useRef, useState, type ClipboardEvent, type KeyboardEvent } from 'react'
import { useAnnounce } from '@/components/providers/Announcer'
import type * as EngineModule from '@/lib/search/engine'
import { useIngredientLabel, useIngredientNames } from '@/components/providers/IngredientLabels'
import { cx } from '@/lib/cx'
import type { SuggestionIndex } from '@/lib/search/suggest'
import { MAX_INGREDIENTS } from '@/types/recipe'

type Engine = typeof EngineModule
let enginePromise: Promise<Engine> | undefined
/** The matching engine (~30 KB) loads on first interaction, not with the page. */
export function loadEngine(): Promise<Engine> {
  enginePromise ??= import('@/lib/search/engine')
  return enginePromise
}

export interface Chip {
  canonical: string
  /** What the user typed, when normalization changed it (shown as a tooltip). */
  original?: string
}

type Notice =
  | { kind: 'limit' }
  | { kind: 'duplicate'; name: string }
  | { kind: 'unknown'; input: string; suggestions: string[] }

const SUGGEST_DEBOUNCE_MS = 150
const SEPARATORS = /[,،;؛\n]/

interface IngredientInputProps {
  chips: readonly Chip[]
  onAdd: (chips: Chip[]) => void
  onRemove: (canonical: string) => void
  onClear: () => void
}

export function IngredientInput({ chips, onAdd, onRemove, onClear }: IngredientInputProps) {
  const t = useTranslations('find')
  const label = useIngredientLabel()
  const arabicNames = useIngredientNames()
  const announce = useAnnounce()
  const id = useId()
  const inputId = `${id}-input`
  const listId = `${id}-list`
  const hintId = `${id}-hint`
  const noticeId = `${id}-notice`

  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(-1)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [notice, setNotice] = useState<Notice | null>(null)
  // The index is rebuilt when the language (and so the Arabic names table) changes.
  const [built, setBuilt] = useState<{ names: typeof arabicNames; index: SuggestionIndex }>()
  const index = built && built.names === arabicNames ? built.index : undefined
  const inputRef = useRef<HTMLInputElement>(null)
  const chosen = new Set(chips.map((chip) => chip.canonical))
  const visible = query.trim() ? suggestions : []

  async function ensureIndex(): Promise<{ engine: Engine; index: SuggestionIndex }> {
    const engine = await loadEngine()
    if (index) return { engine, index }
    const fresh = engine.buildIngredientIndex(arabicNames)
    setBuilt({ names: arabicNames, index: fresh })
    return { engine, index: fresh }
  }

  // Debounced suggestions (state is only set from the timer, never synchronously).
  useEffect(() => {
    if (!query.trim()) return
    let cancelled = false
    const timer = setTimeout(async () => {
      const { engine, index: ready } = await ensureIndex()
      if (cancelled) return
      const next = engine.suggest(ready, query, { exclude: new Set(chips.map((c) => c.canonical)) })
      setSuggestions(next)
      setActive(-1)
      setOpen(next.length > 0)
    }, SUGGEST_DEBOUNCE_MS)
    return () => {
      cancelled = true
      clearTimeout(timer)
    }
    // ensureIndex is stable enough: it only reads the memoized index.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, chips, index])

  function close() {
    setOpen(false)
    setActive(-1)
  }

  function addChips(next: Chip[], feedback: Notice | null) {
    if (next.length > 0) onAdd(next)
    setNotice(feedback)
    if (next.length === 1) announce(t('added', { name: label(next[0]!.canonical) }))
    else if (next.length > 1) announce(t('addedMany', { count: next.length }))
    else if (feedback?.kind === 'limit') announce(t('limit', { max: MAX_INGREDIENTS }))
    else if (feedback?.kind === 'duplicate') announce(t('duplicate', { name: feedback.name }))
    else if (feedback?.kind === 'unknown') announce(t('unknown', { input: feedback.input }))
  }

  /** Adds everything typed or pasted (comma/newline separated, any language). */
  async function commit(text: string) {
    const { engine, index: ready } = await ensureIndex()
    const items = engine.splitIngredientInput(text)
    if (items.length === 0) return
    const known = new Set(chosen)
    const added: Chip[] = []
    const unknown: string[] = []
    let duplicate: string | undefined
    let limited = false
    for (const item of items) {
      const resolved = engine.resolveIngredient(item)
      // Unknown words and typos never become chips: they would match nothing.
      if (!resolved.canonical || !engine.isKnownIngredient(resolved.canonical))
        unknown.push(resolved.input)
      else if (known.has(resolved.canonical)) duplicate = resolved.canonical
      else if (known.size >= MAX_INGREDIENTS) limited = true
      else {
        known.add(resolved.canonical)
        added.push({
          canonical: resolved.canonical,
          original: resolved.changed ? resolved.input : undefined,
        })
      }
    }
    let feedback: Notice | null = null
    if (limited) feedback = { kind: 'limit' }
    else if (unknown[0] !== undefined)
      feedback = {
        kind: 'unknown',
        input: unknown[0],
        suggestions: engine.suggest(ready, unknown[0], { limit: 3, exclude: known }),
      }
    else if (duplicate && added.length === 0)
      feedback = { kind: 'duplicate', name: label(duplicate) }
    addChips(added, feedback)
    // Keep a single unrecognised word in the box so it can be corrected. Only touch the box if it
    // still holds what was submitted: the user may already be typing the next ingredient.
    const keep = unknown.length === 1 && items.length === 1 ? unknown[0]! : ''
    setQuery((current) => (current === text ? keep : current))
    close()
  }

  /** Enter with the list open: a known ingredient is added as typed; otherwise the best suggestion
   *  is taken ("tomat" + Enter → Tomato). Lists and unknown words go through commit(). */
  async function commitOrPickFirst(text: string) {
    const { engine } = await ensureIndex()
    const first = open ? visible[0] : undefined
    const resolved = engine.resolveIngredient(text)
    const known = resolved.canonical !== null && engine.isKnownIngredient(resolved.canonical)
    if (first && !known && !SEPARATORS.test(text)) select(first, text)
    else await commit(text)
  }

  /** `typed` is the text the pick replaces; the box is only cleared if it still shows it. */
  function select(canonical: string, typed?: string) {
    if (chosen.size >= MAX_INGREDIENTS) addChips([], { kind: 'limit' })
    else addChips([{ canonical }], null)
    setQuery((current) => (typed === undefined || current === typed ? '' : current))
    close()
    inputRef.current?.focus()
  }

  function onKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case 'ArrowDown':
        if (visible.length === 0) return
        event.preventDefault()
        setOpen(true)
        setActive((current) => (current + 1) % visible.length)
        return
      case 'ArrowUp':
        if (visible.length === 0) return
        event.preventDefault()
        setOpen(true)
        setActive((current) => (current <= 0 ? visible.length - 1 : current - 1))
        return
      case 'Enter': {
        event.preventDefault()
        const picked = open && active >= 0 ? visible[active] : undefined
        if (picked) select(picked)
        else if (query.trim()) void commitOrPickFirst(query)
        return
      }
      case ',':
      case '،':
        event.preventDefault()
        if (query.trim()) void commit(query)
        return
      case 'Escape':
        if (open) {
          event.preventDefault()
          close()
        } else if (query) {
          event.preventDefault()
          setQuery('')
        }
        return
      case 'Backspace':
        if (query === '' && chips.length > 0) {
          event.preventDefault()
          const last = chips[chips.length - 1]!
          onRemove(last.canonical)
          announce(t('removed', { name: label(last.canonical) }))
        }
        return
      case 'Tab':
        close()
        return
    }
  }

  function onPaste(event: ClipboardEvent<HTMLInputElement>) {
    const text = event.clipboardData.getData('text')
    if (!SEPARATORS.test(text)) return
    event.preventDefault()
    void commit(`${query}${text}`)
  }

  const describedBy = [hintId, notice ? noticeId : null].filter(Boolean).join(' ')

  return (
    <div className="space-y-3">
      <label htmlFor={inputId} className="block text-sm font-semibold">
        {t('inputLabel')}
      </label>
      <div className="rounded-card bg-surface p-3 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] focus-within:shadow-[0_0_0_2px_var(--color-ring)]">
        {chips.length > 0 && (
          <ul aria-label={t('yourIngredients')} className="mb-2 flex flex-wrap gap-2">
            {chips.map((chip) => (
              <li
                key={chip.canonical}
                className="chip inline-flex min-h-10 max-w-full items-center gap-1 rounded-chip bg-surface-2 ps-3 pe-1 text-sm font-semibold shadow-[inset_0_-2px_0_var(--color-line)]"
              >
                <ChipText label={label(chip.canonical)} original={chip.original} />
                <button
                  type="button"
                  onClick={() => {
                    onRemove(chip.canonical)
                    announce(t('removed', { name: label(chip.canonical) }))
                    inputRef.current?.focus()
                  }}
                  aria-label={t('remove', { name: label(chip.canonical) })}
                  className="relative grid size-8 shrink-0 place-items-center rounded-full text-fg-muted transition-colors duration-150 before:absolute before:-inset-1.5 before:content-[''] hover:bg-bg hover:text-danger"
                >
                  <X aria-hidden="true" className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
        <div className="relative">
          <input
            ref={inputRef}
            id={inputId}
            type="text"
            role="combobox"
            aria-expanded={open && visible.length > 0}
            aria-controls={listId}
            aria-autocomplete="list"
            aria-activedescendant={open && active >= 0 ? `${listId}-${active}` : undefined}
            aria-describedby={describedBy}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            enterKeyHint="enter"
            dir="auto"
            value={query}
            placeholder={t('inputPlaceholder')}
            onChange={(event) => {
              setQuery(event.target.value)
              if (notice?.kind !== 'limit') setNotice(null)
            }}
            onFocus={() => void loadEngine()}
            onKeyDown={onKeyDown}
            onPaste={onPaste}
            onBlur={() => setTimeout(close, 120)}
            className="min-h-12 w-full rounded-btn bg-transparent px-2 text-base outline-none placeholder:text-fg-muted"
          />
          <ul
            id={listId}
            role="listbox"
            aria-label={t('suggestions')}
            hidden={!open || visible.length === 0}
            className="suggestions absolute inset-x-0 top-full z-30 mt-2 max-h-72 overflow-y-auto overscroll-contain rounded-btn bg-surface p-1 shadow-[0_12px_32px_-12px_rgb(0_0_0/0.35),0_0_0_1px_var(--color-line)]"
          >
            {visible.map((canonical, position) => (
              <li
                key={canonical}
                id={`${listId}-${position}`}
                role="option"
                aria-selected={position === active}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => select(canonical)}
                className={cx(
                  'flex min-h-11 cursor-pointer items-center rounded-[8px] px-3 text-base',
                  position === active ? 'bg-primary-soft text-primary' : 'hover:bg-surface-2',
                )}
              >
                <span dir="auto">{label(canonical)}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="flex flex-wrap items-start justify-between gap-x-4 gap-y-2">
        <p id={hintId} className="text-sm text-fg-muted">
          {t('inputHint')}
        </p>
        {chips.length > 0 && (
          <button
            type="button"
            onClick={() => {
              onClear()
              setNotice(null)
              announce(t('cleared'))
              inputRef.current?.focus()
            }}
            className="min-h-11 rounded-btn px-3 text-sm font-semibold text-danger underline-offset-4 hover:underline"
          >
            {t('clearAll')}
          </button>
        )}
      </div>
      {notice && (
        <div id={noticeId} className="rounded-btn bg-missing-soft px-3 py-2 text-sm text-fg">
          {notice.kind === 'limit' && <p>{t('limit', { max: MAX_INGREDIENTS })}</p>}
          {notice.kind === 'duplicate' && <p>{t('duplicate', { name: notice.name })}</p>}
          {notice.kind === 'unknown' && (
            <>
              <p>{t('unknown', { input: notice.input })}</p>
              {notice.suggestions.length > 0 && (
                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <span>{t('didYouMean')}</span>
                  {notice.suggestions.map((canonical) => (
                    <button
                      key={canonical}
                      type="button"
                      onClick={() => select(canonical)}
                      className="min-h-11 rounded-chip bg-surface px-3 font-semibold text-primary"
                    >
                      {label(canonical)}
                    </button>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}

function ChipText({ label, original }: { label: string; original?: string }) {
  const t = useTranslations('find')
  const text = (
    <span dir="auto" className="min-w-0 truncate">
      {label}
      {original && <span className="sr-only"> ({t('typed', { input: original })})</span>}
    </span>
  )
  if (!original) return text
  return (
    <Tooltip.Root>
      <Tooltip.Trigger asChild>{text}</Tooltip.Trigger>
      <Tooltip.Portal>
        <Tooltip.Content
          side="top"
          sideOffset={6}
          className="tooltip z-50 rounded-btn bg-fg px-3 py-1.5 text-sm text-bg"
        >
          {t('typed', { input: original })}
          <Tooltip.Arrow className="fill-fg" />
        </Tooltip.Content>
      </Tooltip.Portal>
    </Tooltip.Root>
  )
}
