'use client'

import { Play } from 'lucide-react'
import { useState } from 'react'

interface YouTubeFacadeProps {
  videoId: string
  title: string
  /** The accessible name of the play button, e.g. "Play video: Goblet squat". */
  playLabel: string
  /** YouTube's interface language. */
  lang: string
  /** Shown bottom-end over the thumbnail, e.g. "1:27". */
  badge?: string
}

/**
 * A YouTube video that loads nothing but its thumbnail until pressed; then the privacy-enhanced
 * player (youtube-nocookie.com) takes its place and starts.
 */
export function YouTubeFacade({ videoId, title, playLabel, lang, badge }: YouTubeFacadeProps) {
  const [playing, setPlaying] = useState(false)
  return (
    <div className="relative aspect-video overflow-hidden rounded-card bg-fg">
      {playing ? (
        <iframe
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0&playsinline=1&hl=${lang}`}
          title={title}
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          className="absolute inset-0 size-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={playLabel}
          className="group absolute inset-0 grid place-items-center"
        >
          {/* YouTube's own thumbnail; next/image adds nothing for a remote image shown once. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`}
            alt=""
            className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
          />
          <span className="relative grid size-16 place-items-center rounded-full bg-accent text-on-accent shadow-lg transition-[scale] duration-150 motion-safe:group-active:scale-95">
            <Play aria-hidden="true" className="ms-1 size-7" fill="currentColor" />
          </span>
          {badge && (
            <span className="absolute end-3 bottom-3 rounded-chip bg-fg/80 px-2 py-0.5 text-xs font-semibold text-bg tabular-nums">
              {badge}
            </span>
          )}
        </button>
      )}
    </div>
  )
}
