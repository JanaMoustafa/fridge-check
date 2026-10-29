'use client'

import { useLocale } from 'next-intl'
import { useEffect, useRef, useState } from 'react'

export interface ChartPoint {
  weightKg: number
  lowKg: number
  highKg: number
  /** The x-axis label ("Now", "Month 1"…). */
  label: string
  /** The value label ("66.0 kg"). */
  value: string
  /** The tooltip's second line ("65.3–66.7 kg likely"). */
  range: string
}

/** Drawn at the container's real width, so text stays 12px on a phone and on a desktop. */
const DEFAULT_WIDTH = 600
const HEIGHT = 240
const PAD = { top: 28, right: 20, bottom: 32, left: 44 }

/** A round step for about four gridlines across `span`. */
function niceStep(span: number): number {
  const raw = span / 4
  return [0.5, 1, 2, 5, 10, 20].find((step) => step >= raw) ?? 50
}

/**
 * Expected weight month by month: one line with the likely range shaded around it, direct labels
 * at the start and the end, and a crosshair with the month's numbers on hover. The monthly goals
 * table beside it carries the same numbers for keyboard and screen-reader users.
 */
export function ProjectionChart({ points, title }: { points: ChartPoint[]; title: string }) {
  const rtl = useLocale() === 'ar'
  const [active, setActive] = useState<number | null>(null)
  const [width, setWidth] = useState(DEFAULT_WIDTH)
  const figure = useRef<HTMLElement>(null)
  useEffect(() => {
    const element = figure.current
    if (!element) return
    const observer = new ResizeObserver(([entry]) => {
      if (entry) setWidth(Math.max(280, Math.round(entry.contentRect.width)))
    })
    observer.observe(element)
    return () => observer.disconnect()
  }, [])
  const lows = points.map((point) => point.lowKg)
  const highs = points.map((point) => point.highKg)
  let min = Math.min(...lows)
  let max = Math.max(...highs)
  if (max - min < 4) {
    const middle = (max + min) / 2
    min = middle - 2
    max = middle + 2
  }
  const step = niceStep(max - min)
  const yMin = Math.floor(min / step) * step
  const yMax = Math.ceil(max / step) * step
  const ticks: number[] = []
  for (let tick = yMin; tick <= yMax + 1e-9; tick += step) ticks.push(tick)

  const plotWidth = width - PAD.left - PAD.right
  const plotHeight = HEIGHT - PAD.top - PAD.bottom
  const x = (index: number) => PAD.left + (index / (points.length - 1)) * plotWidth
  const y = (kg: number) => PAD.top + ((yMax - kg) / (yMax - yMin)) * plotHeight
  const line = points.map((point, i) => `${i ? 'L' : 'M'}${x(i)},${y(point.weightKg)}`).join('')
  const band =
    points.map((point, i) => `${i ? 'L' : 'M'}${x(i)},${y(point.highKg)}`).join('') +
    [...points]
      .reverse()
      .map((point, i) => `L${x(points.length - 1 - i)},${y(point.lowKg)}`)
      .join('') +
    'Z'
  const last = points.length - 1
  const shown = active === null ? null : points[active]!

  return (
    <figure ref={figure} className="relative">
      <svg
        viewBox={`0 0 ${width} ${HEIGHT}`}
        direction="ltr"
        role="img"
        aria-label={title}
        width={width}
        height={HEIGHT}
        className="block h-auto w-full overflow-visible"
        onMouseLeave={() => setActive(null)}
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              x1={PAD.left}
              x2={width - PAD.right}
              y1={y(tick)}
              y2={y(tick)}
              stroke="var(--color-line)"
              strokeWidth={1}
            />
            <text
              x={PAD.left - 8}
              y={y(tick)}
              textAnchor="end"
              dominantBaseline="middle"
              className="fill-fg-muted text-[12px] tabular-nums"
            >
              {Number.isInteger(tick) ? tick : tick.toFixed(1)}
            </text>
          </g>
        ))}
        {points.map((point, i) => (
          <text
            key={point.label}
            x={x(i)}
            y={HEIGHT - 8}
            textAnchor={i === 0 ? 'start' : i === last ? 'end' : 'middle'}
            className="fill-fg-muted text-[12px]"
          >
            {point.label}
          </text>
        ))}
        <path d={band} fill="var(--color-primary)" fillOpacity={0.14} />
        {shown && active !== null && (
          <line
            x1={x(active)}
            x2={x(active)}
            y1={PAD.top}
            y2={HEIGHT - PAD.bottom}
            stroke="var(--color-fg-muted)"
            strokeWidth={1}
            strokeDasharray="3 3"
          />
        )}
        <path
          d={line}
          fill="none"
          stroke="var(--color-primary)"
          strokeWidth={2}
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {points.map((point, i) => (
          <circle
            key={point.label}
            cx={x(i)}
            cy={y(point.weightKg)}
            r={active === i ? 6 : 4}
            fill="var(--color-primary)"
            stroke="var(--color-surface)"
            strokeWidth={2}
          />
        ))}
        {[0, last].map((i) => (
          <text
            key={i}
            x={x(i)}
            y={y(points[i]!.highKg) - 10}
            // Arabic labels run right to left, where "start" is the text's right edge.
            direction={rtl ? 'rtl' : 'ltr'}
            textAnchor={(i === 0) !== rtl ? 'start' : 'end'}
            className="fill-fg text-[13px] font-bold tabular-nums"
          >
            {points[i]!.value}
          </text>
        ))}
        {points.map((point, i) => (
          <rect
            key={point.label}
            aria-hidden="true"
            x={x(i) - plotWidth / last / 2}
            y={PAD.top}
            width={plotWidth / last}
            height={plotHeight}
            fill="transparent"
            onMouseEnter={() => setActive(i)}
            onTouchStart={() => setActive(i)}
          />
        ))}
      </svg>
      {shown && active !== null && (
        <div
          aria-hidden="true"
          className="pointer-events-none absolute z-10 -translate-x-1/2 -translate-y-full rounded-btn bg-fg px-3 py-2 text-xs whitespace-nowrap text-bg shadow-lg"
          style={{
            left: `${Math.min(88, Math.max(12, (x(active) / width) * 100))}%`,
            top: `${(y(shown.highKg) / HEIGHT) * 100}%`,
            marginTop: -8,
          }}
        >
          <p className="font-bold">{shown.label}</p>
          <p className="tabular-nums">{shown.value}</p>
          <p className="tabular-nums opacity-80">{shown.range}</p>
        </div>
      )}
    </figure>
  )
}
