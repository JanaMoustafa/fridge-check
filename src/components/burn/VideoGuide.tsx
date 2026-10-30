'use client'

import { useTranslations } from 'next-intl'
import { YouTubeFacade } from '@/components/ui/YouTubeFacade'
import type { ExerciseVideo } from '@/lib/burn/videos'
import { formatDuration } from '@/lib/burn/videos'

/** The exercise's demonstration video: a real trainer on YouTube, loaded only when pressed. */
export function VideoGuide({ video }: { video: ExerciseVideo }) {
  const t = useTranslations('burn.exercise')
  const duration = formatDuration(video.durationSeconds)
  return (
    <figure className="space-y-2">
      <YouTubeFacade
        videoId={video.videoId}
        title={video.title}
        playLabel={t('videoPlay', { title: video.title })}
        lang={t('videoLang')}
        badge={duration}
      />
      <figcaption className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-sm text-fg-muted">
        <span>{t('videoCredit', { channel: video.channel, duration })}</span>
        <a
          href={`https://www.youtube.com/watch?v=${video.videoId}`}
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-primary"
        >
          {t('videoWatch')}
        </a>
      </figcaption>
    </figure>
  )
}
