import type { LucideIcon } from 'lucide-react'
import Link from 'next/link'
import { buttonClasses } from './button'

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  body: string
  action?: { href: string; label: string }
}

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <section className="mx-auto flex max-w-md flex-col items-center rounded-card bg-surface px-6 py-12 text-center shadow-[inset_0_1px_0_var(--color-highlight)] motion-safe:animate-rise-in">
      <span className="mb-5 grid size-16 place-items-center rounded-chip bg-surface-2 text-primary shadow-[inset_0_-2px_0_var(--color-line)]">
        <Icon aria-hidden="true" className="size-7" />
      </span>
      <h2 className="text-xl font-extrabold">{title}</h2>
      <p className="mt-2 text-fg-muted">{body}</p>
      {action && (
        <Link
          href={action.href}
          transitionTypes={['nav-tab']}
          className={buttonClasses({ className: 'mt-6' })}
        >
          {action.label}
        </Link>
      )}
    </section>
  )
}
