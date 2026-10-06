/** Fridge-door mark: a rounded door with a handle and a magnet tick. Decorative; the wordmark carries the name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden="true" className={className}>
      <rect x="5" y="2.5" width="22" height="27" rx="6" fill="var(--color-primary)" />
      <rect
        x="5"
        y="2.5"
        width="22"
        height="27"
        rx="6"
        fill="none"
        stroke="var(--color-highlight)"
        strokeWidth="1"
      />
      <path d="M5 12.5h22" stroke="var(--color-bg)" strokeWidth="1.6" />
      <rect x="21" y="5.5" width="2.4" height="4.5" rx="1.2" fill="var(--color-on-primary)" />
      <rect x="21" y="15.5" width="2.4" height="7" rx="1.2" fill="var(--color-on-primary)" />
      <rect x="9" y="16" width="8.5" height="8.5" rx="2.4" fill="var(--color-have-soft)" />
      <path
        d="m10.9 20.3 1.8 1.8 3.3-3.6"
        fill="none"
        stroke="var(--color-have)"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
