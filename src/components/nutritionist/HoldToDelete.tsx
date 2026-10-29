'use client'

import { Trash2 } from 'lucide-react'
import { useRef, useState } from 'react'
import { deleteScanAction } from '@/app/(app)/nutritionist/actions'

/** How long the delete has to be held: slow and deliberate, so a stray tap can't lose a month. */
const HOLD_MS = 2000

/**
 * Deleting a scan: hold the button while a fill sweeps across it; let go early and nothing
 * happens. Works with pointer and keyboard (hold Space or Enter).
 */
export function HoldToDelete({ id, label, hint }: { id: string; label: string; hint: string }) {
  const form = useRef<HTMLFormElement>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [holding, setHolding] = useState(false)

  function start() {
    if (timer.current) return
    setHolding(true)
    timer.current = setTimeout(() => form.current?.requestSubmit(), HOLD_MS)
  }
  function cancel() {
    if (timer.current) clearTimeout(timer.current)
    timer.current = null
    setHolding(false)
  }

  return (
    <form ref={form} action={deleteScanAction}>
      <input type="hidden" name="id" value={id} />
      <button
        type="button"
        aria-label={label}
        title={hint}
        data-holding={holding || undefined}
        onPointerDown={start}
        onPointerUp={cancel}
        onPointerLeave={cancel}
        onPointerCancel={cancel}
        onContextMenu={(event) => event.preventDefault()}
        onKeyDown={(event) => {
          if ((event.key === ' ' || event.key === 'Enter') && !event.repeat) {
            event.preventDefault()
            start()
          }
        }}
        onKeyUp={(event) => {
          if (event.key === ' ' || event.key === 'Enter') cancel()
        }}
        onBlur={cancel}
        className="hold-delete relative inline-flex min-h-11 touch-none items-center gap-2 overflow-hidden rounded-btn px-3 text-sm font-semibold text-danger select-none"
      >
        <span aria-hidden="true" className="hold-delete-fill absolute inset-0 bg-danger/15" />
        <Trash2 aria-hidden="true" className="relative size-4" />
        <span aria-hidden="true" className="relative">
          {hint}
        </span>
      </button>
    </form>
  )
}
