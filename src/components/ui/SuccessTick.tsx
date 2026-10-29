/**
 * The tick for rare success notices (a scan saved, a programme ready): it draws itself once
 * (.success-tick in globals.css). Decorative; the notice's text says what happened.
 */
export function SuccessTick({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={`success-tick ${className ?? ''}`}>
      <circle
        className="success-tick-ring"
        cx="12"
        cy="12"
        r="10"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
      />
      <path
        className="success-tick-check"
        d="m7.5 12.5 3 3 6-6.5"
        pathLength={1}
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
