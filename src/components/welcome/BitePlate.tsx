/**
 * The intro page's signature moment: the BiteDoneRight mark drawn large, taking its three bites
 * one after another (pieces of the plate flying out of each) and then ticking itself "done right". It ends as
 * the logo, exactly. All motion is CSS in globals.css (.bite-plate), off under reduced motion,
 * and the plate turns while Google sign-in opens.
 */

/** The logo's bite: three circles in the page colour, in the order they are bitten. */
const BITES = [
  { cx: 132, cy: 34, r: 30 },
  { cx: 104, cy: 16, r: 16 },
  { cx: 146, cy: 62, r: 14 },
] as const

/** Crumbs per bite: where each lands, relative to the bite's centre (x, y), and its size. */
const CRUMBS = [
  [
    [22, 58, 4.5],
    [40, 34, 3.2],
    [6, 76, 2.6],
  ],
  [
    [-14, 46, 3.4],
    [12, 64, 2.4],
  ],
  [
    [26, 52, 3.6],
    [8, 74, 2.4],
  ],
] as const

export function BitePlate({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 160" aria-hidden="true" className={`bite-plate ${className ?? ''}`}>
      <g className="bite-plate-disc">
        <circle cx="80" cy="84" r="68" fill="var(--color-primary)" />
        {BITES.map((bite, i) => (
          <circle
            key={i}
            className="bite-plate-bite"
            style={{ '--i': i } as React.CSSProperties}
            cx={bite.cx}
            cy={bite.cy}
            r={bite.r}
            fill="var(--color-bg)"
          />
        ))}
        <path
          className="bite-plate-tick"
          d="M50 86l20 20 40-44"
          pathLength={1}
          fill="none"
          stroke="var(--color-on-primary)"
          strokeWidth="14"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {BITES.map((bite, i) =>
        CRUMBS[i]!.map(([dx, dy, r], j) => (
          <circle
            key={`${i}-${j}`}
            className="bite-plate-crumb"
            style={
              {
                '--i': i,
                '--dx': `${dx}px`,
                '--dy': `${dy}px`,
              } as React.CSSProperties
            }
            cx={bite.cx}
            cy={bite.cy}
            r={r}
            fill="var(--color-primary)"
          />
        )),
      )}
    </svg>
  )
}
