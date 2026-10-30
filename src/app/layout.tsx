import type { Metadata, Viewport } from 'next'
import { headers } from 'next/headers'
import { NextIntlClientProvider } from 'next-intl'
import { getLocale, getTranslations } from 'next-intl/server'
import { AppProviders } from '@/components/layout/AppProviders'
import { PREPAINT_SCRIPT } from '@/lib/boot/prepaint-script'
import { directionOf } from '@/lib/i18n/locale'
import { getSiteUrl } from '@/lib/site-url'
import { arabicFont, latinFont } from './fonts'
import './globals.css'

export async function generateMetadata(): Promise<Metadata> {
  const [locale, t] = await Promise.all([getLocale(), getTranslations('metadata')])
  const appName = 'BiteDoneRight'
  return {
    metadataBase: getSiteUrl(),
    title: { default: t('title'), template: `%s · ${appName}` },
    description: t('description'),
    applicationName: appName,
    openGraph: {
      type: 'website',
      siteName: appName,
      title: t('title'),
      description: t('description'),
      locale: locale === 'ar' ? 'ar_EG' : 'en_US',
      alternateLocale: locale === 'ar' ? ['en_US'] : ['ar_EG'],
    },
    twitter: { card: 'summary_large_image' },
    formatDetection: { telephone: false },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffe8d6' },
    { media: '(prefers-color-scheme: dark)', color: '#2a2c3f' },
  ],
}

export default async function RootLayout({ children }: LayoutProps<'/'>) {
  const [locale, nonce] = await Promise.all([
    getLocale(),
    headers().then((h) => h.get('x-nonce') ?? undefined),
  ])
  const dir = directionOf(locale)

  return (
    <html
      lang={locale}
      dir={dir}
      className={`${latinFont.variable} ${arabicFont.variable}`}
      // The pre-paint script sets data-theme before hydration.
      suppressHydrationWarning
    >
      <head>
        <script
          nonce={nonce}
          // Static first-party boot script (theme + locale sync); never third-party content.
          // eslint-disable-next-line react/no-danger
          dangerouslySetInnerHTML={{ __html: PREPAINT_SCRIPT }}
        />
      </head>
      <body className="flex min-h-dvh flex-col antialiased">
        <NextIntlClientProvider>
          <AppProviders dir={dir}>{children}</AppProviders>
        </NextIntlClientProvider>
      </body>
    </html>
  )
}
