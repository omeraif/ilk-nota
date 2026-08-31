import { useEffect, useState } from 'react'
import { msUntilNextPuzzle } from '../lib/daily'
import { trackLabel } from '../lib/search'
import { attemptEmojis } from '../lib/share'
import type { DailyState, Stats, Track } from '../types'

interface Props {
  state: DailyState
  track: Track
  stats: Stats
  onShare: () => void
}

function fmtCountdown(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = String(Math.floor(total / 3600)).padStart(2, '0')
  const m = String(Math.floor((total % 3600) / 60)).padStart(2, '0')
  const s = String(total % 60).padStart(2, '0')
  return `${h}:${m}:${s}`
}

const DIST_KEYS = ['1', '2', '3', '4', '5', '6', 'X'] as const

/** Finished-daily state: reveal, stats, countdown, share — the locked view. */
export function ResultPanel({ state, track, stats, onShare }: Props) {
  const won = state.status === 'won'
  const [remaining, setRemaining] = useState(msUntilNextPuzzle())

  useEffect(() => {
    const id = window.setInterval(() => setRemaining(msUntilNextPuzzle()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const maxDist = Math.max(1, ...DIST_KEYS.map((k) => stats.dist[k] ?? 0))
  const todayBucket = won ? String(state.guesses.length) : 'X'
  const winRate = stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0

  return (
    <section className="animate-rise flex w-full flex-col gap-5" aria-label="Sonuç">
      <div className="flex flex-col items-center gap-1 text-center">
        <p className={`font-display text-2xl font-bold ${won ? 'text-lime-500' : 'text-ember-400'}`}>
          {won ? `${state.guesses.length}. denemede buldun!` : 'Bu sefer olmadı.'}
        </p>
        <p className="text-sm text-night-400">Günün şarkısı:</p>
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

      <div className="grid grid-cols-4 gap-2">
        {[
          [stats.played, 'Oyun'],
          [`%${winRate}`, 'Kazanma'],
          [stats.streak, 'Seri'],
          [stats.maxStreak, 'Rekor'],
        ].map(([value, label]) => (
          <div key={label} className="rounded-xl bg-night-850 px-2 py-3 text-center">
            <p className="font-display text-xl font-bold text-night-100">{value}</p>
            <p className="mt-0.5 text-[11px] text-night-400">{label}</p>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-night-700 bg-night-850/60 p-4">
        <p className="mb-3 text-xs font-medium tracking-wide text-night-400 uppercase">
          Tahmin dağılımı
        </p>
        <div className="flex flex-col gap-1.5">
          {DIST_KEYS.map((k) => {
            const n = stats.dist[k] ?? 0
            const isToday = k === todayBucket
            return (
              <div key={k} className="flex items-center gap-2 text-xs">
                <span className="w-3 font-display font-semibold text-night-400">{k}</span>
                <div className="h-4 flex-1 overflow-hidden rounded bg-night-800">
                  <div
                    className={`flex h-full min-w-4 items-center justify-end rounded px-1.5 font-display text-[10px] font-bold text-night-950 ${
                      isToday ? (won ? 'bg-lime-500' : 'bg-ember-500') : 'bg-night-600'
                    }`}
                    style={{ width: `${Math.max(8, (n / maxDist) * 100)}%` }}
                  >
                    {n}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex-1 rounded-2xl border border-night-700 bg-night-850/60 px-4 py-3 text-center">
          <p className="text-[11px] text-night-400">Yeni şarkı</p>
          <p className="font-display text-lg font-bold tabular-nums text-night-100">
            {fmtCountdown(remaining)}
          </p>
        </div>
        <button
          type="button"
          onClick={onShare}
          className="h-16 flex-1 cursor-pointer rounded-2xl bg-ember-500 font-display text-base font-bold text-night-950 transition hover:bg-ember-400 active:scale-[0.98]"
        >
          Paylaş
        </button>
      </div>
    </section>
  )
}
