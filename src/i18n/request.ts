import { cookies, headers } from 'next/headers'
import { getRequestConfig } from 'next-intl/server'
import { formats, TIME_ZONE } from '@/lib/i18n/formats'
import { LOCALE_COOKIE, resolveLocale, type Locale } from '@/lib/i18n/locale'

const loaders: Record<Locale, () => Promise<{ default: Record<string, unknown> }>> = {
  en: () => import('../../messages/en.json'),
  ar: () => import('../../messages/ar.json'),
}

export default getRequestConfig(async () => {
  const [cookieStore, headerList] = await Promise.all([cookies(), headers()])
  const locale = resolveLocale({
    cookie: cookieStore.get(LOCALE_COOKIE)?.value,
    acceptLanguage: headerList.get('accept-language'),
  })

  return {
    locale,
    messages: (await loaders[locale]()).default,
    formats,
    timeZone: TIME_ZONE,
  }
})
