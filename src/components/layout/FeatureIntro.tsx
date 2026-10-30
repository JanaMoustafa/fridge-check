'use client'

import { usePathname } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { useEffect, useState, useSyncExternalStore } from 'react'
import { featureOf, type Feature } from '@/lib/navigation/feature-section'

/** How long the intro stays before it clears itself (its animation fits inside this). */
const SHOW_MS = 3400
const LEAVE_MS = 240

/** The find intro's plate: where each ingredient chip flies in from (x, y in rem) and lands. */
const CHIP_FLIGHTS = [
  [-18, -10],
  [18, -8],
  [-16, 12],
  [17, 11],
  [0, -20],
  [2, 20],
] as const

/**
 * A short animated intro that plays each time a member enters one of the three programmes
 * (Find recipes, Your Nutritionist, BurnToReturn): a tap, Skip or Escape ends it early. Moving
 * between a programme's own pages doesn't replay it. Under reduced motion it never shows.
 */
const REDUCED = '(prefers-reduced-motion: reduce)'
const subscribeReduced = (onChange: () => void) => {
  const query = window.matchMedia(REDUCED)
  query.addEventListener('change', onChange)
  return () => query.removeEventListener('change', onChange)
}
const reducedNow = () => window.matchMedia(REDUCED).matches

export function FeatureIntro() {
  const pathname = usePathname()
  const t = useTranslations('intro')
  const tb = useTranslations('burn')
  const reduce = useSyncExternalStore(subscribeReduced, reducedNow, () => false)
  const feature = featureOf(pathname)
  const [active, setActive] = useState<Feature | null>(feature)
  const [leaving, setLeaving] = useState(false)
  // Entering a programme (from elsewhere, or on a fresh load) starts its intro; moving between
  // a programme's own pages does not. Derived during render from the previous pathname.
  const [seen, setSeen] = useState(feature)
  if (feature !== seen) {
    setSeen(feature)
    if (feature) {
      setActive(feature)
      setLeaving(false)
    }
  }

  // The intro ends on its own, or at once on a tap, Skip or Escape.
  useEffect(() => {
    if (!active) return
    const timer = setTimeout(() => setLeaving(true), SHOW_MS)
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setLeaving(true)
    }
    window.addEventListener('keydown', onKey)
    return () => {
      clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
    }
  }, [active])

  useEffect(() => {
    if (!leaving) return
    const timer = setTimeout(() => {
      setActive(null)
      setLeaving(false)
    }, LEAVE_MS)
    return () => clearTimeout(timer)
  }, [leaving])

  if (reduce) return null
  if (!active) return null
  return (
    <div
      role="dialog"
      aria-label={t(`${active}.title`)}
      data-feature={active}
      data-leaving={leaving || undefined}
      onClick={() => setLeaving(true)}
      className="feature-intro fixed inset-0 z-[60] grid cursor-pointer place-items-center overflow-hidden px-6"
    >
      <div className="flex max-w-md flex-col items-center gap-6 text-center">
        {active === 'find' && <FindScene chips={t('find.chips').split(' · ')} />}
        {active === 'nutritionist' && <NutritionistScene />}
        {active === 'burn' && (
          <BurnScene letters={[tb('letters.a'), tb('letters.b'), tb('letters.c')]} />
        )}
        {active === 'chef' && <ChefScene />}
        <h2 className="intro-title text-4xl font-extrabold tracking-tight text-heading">
          {t(`${active}.title`)}
        </h2>
        <p className="intro-line text-lg text-fg-muted">{t(`${active}.line`)}</p>
      </div>
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation()
          setLeaving(true)
        }}
        className="absolute end-4 bottom-[calc(1rem+env(safe-area-inset-bottom))] min-h-11 rounded-btn bg-bg/70 px-4 text-sm font-semibold text-fg"
      >
        {t('skip')}
      </button>
    </div>
  )
}

/** Ingredient chips fly in from the edges and settle in a ring on the plate. */
function FindScene({ chips }: { chips: string[] }) {
  return (
    <div aria-hidden="true" className="relative size-56">
      <div className="intro-plate absolute inset-6 rounded-full bg-primary" />
      {chips.slice(0, CHIP_FLIGHTS.length).map((chip, i) => {
        const [dx, dy] = CHIP_FLIGHTS[i]!
        const angle = (i / CHIP_FLIGHTS.length) * 2 * Math.PI - Math.PI / 2
        return (
          <span
            key={chip}
            className="intro-chip absolute start-1/2 top-1/2 rounded-chip bg-bg px-3 py-1 text-sm font-bold text-fg shadow-md"
            style={
              {
                '--i': i,
                '--dx': `${dx}rem`,
                '--dy': `${dy}rem`,
                '--x': `${Math.cos(angle) * 6.4}rem`,
                '--y': `${Math.sin(angle) * 6.4}rem`,
              } as React.CSSProperties
            }
          >
            {chip}
          </span>
        )
      })}
    </div>
  )
}

/** Three InBody-style bars fill to their marks, then the tick lands. */
function NutritionistScene() {
  const bars = [0.78, 0.62, 0.46]
  return (
    <div aria-hidden="true" className="relative w-64 space-y-3">
      {bars.map((width, i) => (
        <div key={i} className="h-5 overflow-hidden rounded-full bg-bg">
          <div
            className="intro-bar h-full rounded-full bg-primary"
            style={{ '--i': i, '--w': width } as React.CSSProperties}
          />
        </div>
      ))}
      <svg
        viewBox="0 0 24 24"
        className="intro-tick absolute -end-10 top-1/2 size-9 -translate-y-1/2 text-primary"
      >
        <path
          d="m5 12.5 4.5 4.5L19 7.5"
          pathLength={1}
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  )
}

/** The flame draws itself and lights up; the week's A, B and C pop in beneath it. */
function BurnScene({ letters }: { letters: string[] }) {
  return (
    <div aria-hidden="true" className="flex flex-col items-center gap-4">
      <svg viewBox="0 0 24 24" className="intro-flame size-40 text-accent">
        {/* A teardrop flame drawn for filling (no self-crossing), with a paler inner flame. */}
        <path
          className="intro-flame-outer"
          d="M12 22a7 7 0 0 1-7-7c0-4.6 3.2-7.4 7-12.5 3.8 5.1 7 7.9 7 12.5a7 7 0 0 1-7 7Z"
          pathLength={1}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        <path
          className="intro-flame-inner"
          d="M12 10.5c-1.6 2.3-2.6 3.6-2.6 5.3a2.6 2.6 0 0 0 5.2 0c0-1.7-1-3-2.6-5.3Z"
          fill="var(--color-primary-soft)"
        />
      </svg>
      <div className="flex gap-3">
        {letters.map((letter, i) => (
          <span
            key={letter}
            className="intro-badge grid size-10 place-items-center rounded-full bg-accent text-base font-extrabold text-on-accent"
            style={{ '--i': i } as React.CSSProperties}
          >
            {letter}
          </span>
        ))}
      </div>
    </div>
  )
}

/** A pan on the heat: three ingredients hop in one by one, then the steam rises. */
function ChefScene() {
  return (
    <svg viewBox="0 0 200 160" aria-hidden="true" className="intro-pan w-56">
      <g className="intro-pan-body">
        <ellipse cx="90" cy="112" rx="62" ry="18" fill="var(--color-fg)" opacity="0.9" />
        <ellipse cx="90" cy="106" rx="52" ry="12" fill="var(--color-surface-2)" />
        <rect x="150" y="100" width="46" height="9" rx="4.5" fill="var(--color-fg)" opacity="0.9" />
      </g>
      {[
        ['var(--color-accent)', 70, 0],
        ['var(--color-primary)', 92, 1],
        ['var(--color-highlight-soft)', 112, 2],
      ].map(([fill, x, i]) => (
        <circle
          key={String(i)}
          className="intro-ingredient"
          style={{ '--i': i } as React.CSSProperties}
          cx={Number(x)}
          cy={104}
          r={7}
          fill={String(fill)}
        />
      ))}
      {[76, 94, 112].map((x, i) => (
        <path
          key={x}
          className="intro-steam"
          style={{ '--i': i } as React.CSSProperties}
          d={`M${x} 84c-6-8 6-14 0-22`}
          pathLength={1}
          fill="none"
          stroke="var(--color-fg-muted)"
          strokeWidth="3"
          strokeLinecap="round"
        />
      ))}
    </svg>
  )
}
