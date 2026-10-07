import { cx } from '@/lib/cx'

const MAX_SEGMENTS = 14

/**
 * One segment per non-staple ingredient: solid parsley = you have it, dashed saffron outline =
 * missing. Shape and fill differ as well as colour. Decorative — the text beside it says the same.
 */
export function PantryMeter({ used, missing }: { used: number; missing: number }) {
  const total = used + missing
  if (total === 0) return null
  // Long recipes are scaled down so the meter keeps one line.
  const scale = total > MAX_SEGMENTS ? MAX_SEGMENTS / total : 1
  const usedSegments = Math.round(used * scale)
  const segments = Math.max(1, Math.round(total * scale))
  return (
    <div aria-hidden="true" className="flex h-2.5 gap-1">
      {Array.from({ length: segments }, (_, index) => (
        <span
          key={index}
          style={{ '--i': index } as React.CSSProperties}
          className={cx(
            'meter-segment h-full flex-1 rounded-full',
            index < usedSegments
              ? 'bg-have'
              : 'border-[1.5px] border-dashed border-missing bg-missing-soft',
          )}
        />
      ))}
    </div>
  )
}
