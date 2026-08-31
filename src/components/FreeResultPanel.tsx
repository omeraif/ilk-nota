import { useEffect, useRef } from 'react'
import { trackLabel } from '../lib/search'
import { attemptEmojis } from '../lib/share'
import type { DailyState, Track } from '../types'

interface Props {
  state: Pick<DailyState, 'guesses' | 'status'>
  track: Track
  onNext: () => void
}

/** Sınırsız mod sonucu: reveal + "Sonraki Şarkı" — arka arkaya oynamak için. */
export function FreeResultPanel({ state, track, onNext }: Props) {
  const won = state.status === 'won'
  const nextRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    nextRef.current?.focus()
  }, [])

  return (
    <section className="animate-rise flex w-full flex-col gap-5" aria-label="Sonuç">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className={`font-display text-2xl font-bold ${won ? 'text-lime-500' : 'text-ember-400'}`}>
          {won ? `${state.guesses.length}. denemede buldun!` : 'Bu sefer olmadı.'}
        </p>
        <p className="text-sm text-night-400">Şarkı:</p>
      </div>

      <div className="overflow-hidden rounded-2xl border border-night-600 bg-night-850">
        <div className="aspect-video w-full bg-night-800">
          <iframe
            title={trackLabel(track)}
            src={`https://www.youtube-nocookie.com/embed/${track.youtubeId}?rel=0`}
            allow="encrypted-media; picture-in-picture"
            allowFullScreen
            className="h-full w-full"
          />
        </div>
        <div className="flex items-center justify-between gap-3 px-4 py-3">
          <div className="min-w-0">
            <p className="truncate font-display font-semibold text-night-100">{track.title}</p>
            <p className="truncate text-sm text-night-400">
              {[track.artist, ...track.featuring].join(', ')}
            </p>
          </div>
          <span className="shrink-0 rounded-full bg-night-700 px-2.5 py-1 text-xs text-night-300">
            {track.year}
          </span>
        </div>
      </div>

      <p className="text-center font-display text-xl tracking-[0.2em]" aria-hidden="true">
        {attemptEmojis(state)}
      </p>

      <button
        ref={nextRef}
        type="button"
        onClick={onNext}
        className="h-14 w-full cursor-pointer rounded-2xl bg-ember-500 font-display text-base font-bold text-night-950 transition hover:bg-ember-400 active:scale-[0.99]"
      >
        Sonraki Şarkı
      </button>
    </section>
  )
}
