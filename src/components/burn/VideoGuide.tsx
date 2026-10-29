'use client'

import { Play } from 'lucide-react'
import { useTranslations } from 'next-intl'
import { useState } from 'react'
import type { ExerciseVideo } from '@/lib/burn/videos'
import { formatDuration } from '@/lib/burn/videos'

/**
 * The exercise's demonstration video: a real trainer on YouTube. Until the member presses play,
 * only YouTube's thumbnail is loaded (no player script, no cookies); then the privacy-enhanced
 * player (youtube-nocookie.com) takes its place and starts.
 */
export function VideoGuide({ video }: { video: ExerciseVideo }) {
  const t = useTranslations('burn.exercise')
  const [playing, setPlaying] = useState(false)
  const duration = formatDuration(video.durationSeconds)
  return (
    <figure className="space-y-2">
      <div className="relative aspect-video overflow-hidden rounded-card bg-fg">
        {playing ? (
          <iframe
            src={`https://www.youtube-nocookie.com/embed/${video.videoId}?autoplay=1&rel=0&playsinline=1&hl=${t('videoLang')}`}
            title={video.title}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setPlaying(true)}
            aria-label={t('videoPlay', { title: video.title })}
            className="group absolute inset-0 grid place-items-center"
          >
            {/* YouTube's own thumbnail; next/image adds nothing for a remote image shown once. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={`https://i.ytimg.com/vi/${video.videoId}/hqdefault.jpg`}
              alt=""
              className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
            />
            <span className="relative grid size-16 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition-[scale] duration-150 motion-safe:group-active:scale-95">
              <Play aria-hidden="true" className="ms-1 size-7" fill="currentColor" />
            </span>
            <span className="absolute end-3 bottom-3 rounded-chip bg-fg/80 px-2 py-0.5 text-xs font-semibold text-bg tabular-nums">
              {duration}
            </span>
          </button>
        )}
      </div>
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
