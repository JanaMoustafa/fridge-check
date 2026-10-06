import { getTranslations } from 'next-intl/server'

export async function SkipLink() {
  const t = await getTranslations('common')
  return (
    <a
      href="#main"
      className="fixed inset-s-3 top-3 z-[200] -translate-y-24 rounded-btn bg-primary px-4 py-3 font-semibold text-on-primary transition-transform duration-150 focus-visible:translate-y-0"
    >
      {t('skipToContent')}
    </a>
  )
}
