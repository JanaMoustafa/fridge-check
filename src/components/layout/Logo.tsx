/** BiteDoneRight mark: a round plate with a bite taken out and a tick. Decorative; the wordmark carries the name. */
export function LogoMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className={className}>
      <circle cx="80" cy="84" r="68" fill="var(--color-primary)" />
      {/* The bite: three overlapping circles in the page colour. */}
      <circle cx="132" cy="34" r="30" fill="var(--color-bg)" />
      <circle cx="104" cy="16" r="16" fill="var(--color-bg)" />
      <circle cx="146" cy="62" r="14" fill="var(--color-bg)" />
      <path
        d="M50 86l20 20 40-44"
        fill="none"
        stroke="var(--color-on-primary)"
        strokeWidth="14"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
