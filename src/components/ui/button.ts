import { cx } from '@/lib/cx'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'md' | 'icon'

const base =
  'inline-flex select-none items-center justify-center gap-2 rounded-btn font-semibold transition-[background-color,color,border-color,scale] duration-150 motion-safe:active:scale-[0.97] disabled:pointer-events-none disabled:opacity-60'

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-on-primary hover:bg-primary/90',
  secondary: 'border border-line-strong bg-surface text-fg hover:bg-surface-2',
  ghost: 'text-fg-muted hover:bg-surface-2 hover:text-fg',
  danger: 'bg-danger text-on-danger hover:bg-danger/90',
}

const sizes: Record<Size, string> = {
  md: 'min-h-11 px-5 text-sm',
  icon: 'size-11 shrink-0',
}

export function buttonClasses({
  variant = 'primary',
  size = 'md',
  className,
}: { variant?: Variant; size?: Size; className?: string } = {}): string {
  return cx(base, variants[variant], sizes[size], className)
}
