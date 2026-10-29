'use client'

import { LoaderCircle } from 'lucide-react'
import { useFormStatus } from 'react-dom'
import { cx } from '@/lib/cx'

/** A form's submit button that shows it is working while the server saves the pick. */
export function ChooseButton({ label, className }: { label: string; className?: string }) {
  const { pending } = useFormStatus()
  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending || undefined}
      className={cx(
        'inline-flex min-h-9 shrink-0 items-center gap-1.5 rounded-btn border border-line-strong px-3 text-xs font-semibold transition-[scale,background-color] duration-150 disabled:opacity-70 motion-safe:active:scale-95',
        className,
      )}
    >
      {pending && <LoaderCircle aria-hidden="true" className="size-3.5 animate-spin" />}
      {label}
    </button>
  )
}
