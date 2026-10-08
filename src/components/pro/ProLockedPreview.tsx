import { Lock } from 'lucide-react'
import Link from 'next/link'
import { getTranslations } from 'next-intl/server'
import { buttonClasses } from '@/components/ui/button'
import { PRO_PRICE_EGP } from '@/lib/billing/plan'

/** Placeholder shapes only: no real numbers are ever sent to a free user's browser. */
const PLACEHOLDER_ROWS = [72, 54, 63, 41, 58]

/** What free users see instead of the nutrition section: a blurred sketch and the upgrade CTA. */
export async function ProLockedPreview() {
  const t = await getTranslations('nutrition')
  return (
    <section
      aria-labelledby="pro-locked-title"
      className="relative overflow-hidden rounded-card bg-surface p-5 shadow-[inset_0_1px_0_var(--color-highlight),0_0_0_1px_var(--color-line)] sm:p-6 print:hidden"
    >
      <div aria-hidden="true" className="pointer-events-none space-y-3 blur-sm select-none">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((cell) => (
            <div key={cell} className="h-14 rounded-btn bg-surface-2" />
          ))}
        </div>
        {PLACEHOLDER_ROWS.map((width, row) => (
          <div key={row} className="flex items-center justify-between gap-4">
            <div className="h-3 rounded-full bg-surface-2" style={{ width: `${width}%` }} />
            <div className="h-3 w-12 rounded-full bg-surface-2" />
          </div>
        ))}
        <div className="h-2.5 rounded-full bg-have-soft" />
        <div className="h-2.5 w-3/4 rounded-full bg-have-soft" />
      </div>
      <div className="absolute inset-0 grid place-items-center bg-surface/70 p-6 text-center">
        <div className="max-w-sm space-y-3">
          <span className="mx-auto grid size-12 place-items-center rounded-full bg-primary-soft text-primary">
            <Lock aria-hidden="true" className="size-5" />
          </span>
          <h2 id="pro-locked-title" className="text-lg font-extrabold">
            {t('lockedTitle')}
          </h2>
          <p className="text-sm text-fg-muted">{t('lockedBody')}</p>
          <Link href="/pro" className={buttonClasses()}>
            {t('upgrade')}
          </Link>
          <p className="text-xs text-fg-muted">{t('price', { price: PRO_PRICE_EGP })}</p>
        </div>
      </div>
    </section>
  )
}
