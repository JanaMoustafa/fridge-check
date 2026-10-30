import { ChefHat, Flame, Heart, ReceiptText, Salad, Search, type LucideIcon } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { getLocale, getTranslations } from 'next-intl/server'
import { NavCount } from '@/components/layout/NavCount'
import { getSignedInUser } from '@/lib/auth/auth'
import { getProAccess } from '@/lib/billing/access'
import { nextTraining, weekdayOf } from '@/lib/burn/programme'
import { weekdayNames } from '@/lib/burn/text'
import { cx } from '@/lib/cx'
import { getChefRecipes } from '@/lib/data/chef-recipes'
import { getLocalRecipes } from '@/lib/data/local-recipes'
import { getDb } from '@/lib/db/client'
import { isLocale } from '@/lib/i18n/locale'
import { cairoDate } from '@/lib/nutritionist/inbody'
import { getProfile } from '@/lib/server/profiles'
import { getTrainingChoice } from '@/lib/server/training'

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('metadata')
  return { title: { absolute: t('title') }, alternates: { canonical: '/' } }
}

const DAY_MS = 24 * 60 * 60 * 1000

/** Morning, afternoon or evening in Cairo, where the app's days are counted. */
function partOfDay(now: Date): 'morning' | 'afternoon' | 'evening' {
  const hour = Number(
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Africa/Cairo',
      hour: 'numeric',
      hourCycle: 'h23',
    }).format(now),
  )
  if (hour >= 4 && hour < 12) return 'morning'
  if (hour >= 12 && hour < 17) return 'afternoon'
  return 'evening'
}

/** Each programme's colours: its tint for the card, its ink for the icon. */
const TONES = {
  find: 'bg-primary-soft [--ink:var(--color-primary)]',
  nutritionist: 'bg-have-soft [--ink:var(--color-have)]',
  burn: 'bg-missing-soft [--ink:var(--color-accent)]',
  chef: 'bg-highlight-soft [--ink:var(--color-accent)]',
} as const

function ProgrammeCard({
  href,
  icon: Icon,
  tone,
  title,
  status,
  children,
}: {
  href: string
  icon: LucideIcon
  tone: keyof typeof TONES
  title: string
  status: string
  children?: React.ReactNode
}) {
  return (
    <Link
      href={href}
      className={cx(
        'relative flex h-full min-h-44 flex-col justify-between gap-5 overflow-hidden rounded-card p-5 transition-[scale] duration-150 motion-safe:active:scale-[0.98] sm:p-6',
        TONES[tone],
      )}
    >
      {/* The programme's mark, large and faint, as on its own page. */}
      <Icon
        aria-hidden="true"
        className="absolute -end-6 -bottom-8 size-36 text-(--ink) opacity-15"
        strokeWidth={1.5}
      />
      <span className="grid size-11 place-items-center rounded-full bg-bg/45 text-(--ink)">
        <Icon aria-hidden="true" className="size-5" />
      </span>
      <span className="relative space-y-1.5">
        <span className="block text-lg leading-tight font-extrabold text-fg">{title}</span>
        <span className="block text-sm text-fg-muted">{status}</span>
        {children}
      </span>
    </Link>
  )
}

/**
 * BiteDoneRight's home: a greeting, then the four programmes with where the member is in each
 * (today's targets, today's workout), and the lists made from recipes. No intro plays here; each
 * programme's intro plays when it is opened.
 */
export default async function HomePage() {
  const [t, ti, tb, rawLocale, user, local, chef] = await Promise.all([
    getTranslations('home'),
    getTranslations('intro'),
    getTranslations('burn'),
    getLocale(),
    getSignedInUser(),
    getLocalRecipes(),
    getChefRecipes(),
  ])
  const locale = isLocale(rawLocale) ? rawLocale : 'en'
  const now = new Date()
  const [profile, training, access] = user
    ? await Promise.all([
        getProfile(getDb(), user.id, now),
        getTrainingChoice(getDb(), user.id),
        getProAccess(getDb(), user.id, now),
      ])
    : [null, null, null]

  const firstName = user?.name.trim().split(/\s+/)[0]
  const part = partOfDay(now)
  // The name keeps its own direction inside an Arabic sentence.
  const greeting = firstName
    ? t(`greeting.${part}`, { name: `\u2068${firstName}\u2069` })
    : t(`greetingPlain.${part}`)
  const trialDays =
    access?.onTrial && access.trialEndsAt
      ? Math.max(1, Math.ceil((access.trialEndsAt.getTime() - now.getTime()) / DAY_MS))
      : null

  const nutritionStatus = profile
    ? t('nutritionist.today', {
        kcal: profile.targets.calorieTargetKcal,
        protein: profile.targets.proteinG,
      })
    : user
      ? t('nutritionist.start')
      : ti('nutritionist.line')

  let burnStatus = user ? t('burn.start') : ti('burn.line')
  if (training) {
    const weekday = weekdayOf(cairoDate(now))
    const next = nextTraining(training.days, weekday)
    if (next) {
      burnStatus =
        next.inDays === 0
          ? t('burn.today', { workout: tb(`workouts.${training.style}.${next.workout}`) })
          : t('burn.rest', { day: weekdayNames(locale, 'long')[next.weekday]! })
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-7 py-4">
      <header className="space-y-3">
        <h1 className="text-[clamp(2rem,1.4rem+2.6vw,3rem)] leading-[1.05] font-extrabold rtl:leading-[1.35]">
          {greeting}
        </h1>
        <p className="text-lg text-fg-muted">{t('intro')}</p>
        {trialDays !== null && (
          <Link
            href="/pro"
            className="inline-flex min-h-10 items-center rounded-chip bg-highlight-soft px-4 text-sm font-semibold transition-colors duration-150 hover:bg-surface-2"
          >
            {t('trial', { days: trialDays })}
          </Link>
        )}
      </header>

      <ul className="home-grid grid grid-cols-2 gap-3">
        <li className="col-span-2" style={{ '--i': 0 } as React.CSSProperties}>
          <ProgrammeCard
            href="/find"
            icon={Search}
            tone="find"
            title={t('find.title')}
            status={t('find.body')}
          >
            {/* What the search looks like: a hint at what to type, not a field. */}
            <span
              aria-hidden="true"
              className="mt-3 flex min-h-11 items-center gap-2 rounded-btn bg-bg/50 px-3 text-sm text-fg-muted"
            >
              <Search className="size-4 shrink-0" />
              {t('find.prompt')}
            </span>
          </ProgrammeCard>
        </li>
        <li style={{ '--i': 1 } as React.CSSProperties}>
          <ProgrammeCard
            href="/nutritionist"
            icon={Salad}
            tone="nutritionist"
            title={t('nutritionist.title')}
            status={nutritionStatus}
          />
        </li>
        <li style={{ '--i': 2 } as React.CSSProperties}>
          <ProgrammeCard
            href="/burn"
            icon={Flame}
            tone="burn"
            title={t('burn.title')}
            status={burnStatus}
          />
        </li>
        <li className="col-span-2" style={{ '--i': 3 } as React.CSSProperties}>
          <ProgrammeCard
            href="/chef"
            icon={ChefHat}
            tone="chef"
            title={t('chef.title')}
            status={t('chef.body', { count: local.length + chef.length })}
          />
        </li>
        {(
          [
            { href: '/saved', tab: 'saved', icon: Heart, i: 4 },
            { href: '/shopping-list', tab: 'shopping', icon: ReceiptText, i: 5 },
          ] as const
        ).map(({ href, tab, icon: Icon, i }) => (
          <li key={href} style={{ '--i': i } as React.CSSProperties}>
            <Link
              href={href}
              className="flex min-h-16 items-center gap-3 rounded-card bg-surface px-4 transition-[scale] duration-150 motion-safe:active:scale-[0.98]"
            >
              <Icon aria-hidden="true" className="size-5 shrink-0 text-accent" />
              <span className="min-w-0 flex-1 text-sm leading-tight font-semibold">{t(tab)}</span>
              <NavCount tab={tab} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  )
}
