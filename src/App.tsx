import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { AttemptRows } from './components/AttemptRows'
import { FreeResultPanel } from './components/FreeResultPanel'
import { HelpModal } from './components/HelpModal'
import { PlayerDial } from './components/PlayerDial'
import { ResultPanel } from './components/ResultPanel'
import { SearchBox } from './components/SearchBox'
import { TRACKS } from './data/tracks'
import { useYouTubePlayer } from './hooks/useYouTubePlayer'
import { dayNumber, localDateStr, pickDailyTrack } from './lib/daily'
import {
  advanceFreeSession,
  loadFreeSession,
  saveFreeSession,
  type FreeSession,
} from './lib/freeplay'
import type { Suggestion } from './lib/search'
import { buildShareText, shareResult } from './lib/share'
import { loadStats, recordResult } from './lib/stats'
import { storage } from './lib/storage'
import {
  CLIP_STAGES,
  GENRES,
  MAX_ATTEMPTS,
  type DailyState,
  type GameStatus,
  type GenreId,
  type GuessEntry,
  type Track,
} from './types'

type Mode = 'daily' | 'free'

const tracksOf = (genre: GenreId): Track[] => TRACKS.filter((t) => t.genre === genre)

function loadDaily(dateStr: string, genre: GenreId, track: Track): DailyState {
  const saved = storage.get<DailyState | null>(`daily:${dateStr}:${genre}`, null)
  if (saved !== null && saved.trackId === track.id) return saved
  return { date: dateStr, day: dayNumber(dateStr), trackId: track.id, guesses: [], status: 'playing' }
}

function isGenreId(v: unknown): v is GenreId {
  return typeof v === 'string' && GENRES.some((g) => g.id === v)
}

export default function App() {
  const dateStr = useMemo(() => localDateStr(), [])
  const day = dayNumber(dateStr)

  const [genre, setGenre] = useState<GenreId>(() => {
    const saved = storage.get<string>('genre', 'rap')
    return isGenreId(saved) && tracksOf(saved).length > 0 ? saved : 'rap'
  })
  const genreTracks = useMemo(() => tracksOf(genre), [genre])
  const genreLabel = GENRES.find((g) => g.id === genre)?.label ?? ''
  const dailyTrack = useMemo(
    () => pickDailyTrack(genreTracks, dateStr, genre),
    [genreTracks, dateStr, genre],
  )

  const [mode, setMode] = useState<Mode>('daily')
  const [daily, setDaily] = useState<DailyState>(() => loadDaily(dateStr, genre, dailyTrack))
  const [free, setFree] = useState<FreeSession>(() => loadFreeSession(genre, genreTracks))
  const [stats, setStats] = useState(() => loadStats(genre))
  const [staged, setStaged] = useState<Suggestion | null>(null)
  const [showHelp, setShowHelp] = useState(() => !storage.get('seenHelp', false))
  const [toast, setToast] = useState<string | null>(null)
  const [shake, setShake] = useState(false)
  const [announce, setAnnounce] = useState('')
  const volumeRef = useRef(100)
  const chipsRef = useRef<HTMLDivElement>(null)

  const freeTrack = useMemo(
    () => genreTracks.find((t) => t.id === free.queue[free.pos]) ?? genreTracks[0],
    [genreTracks, free.queue, free.pos],
  )
  const track = mode === 'daily' ? dailyTrack : freeTrack
  const curGuesses = mode === 'daily' ? daily.guesses : free.guesses
  const curStatus = mode === 'daily' ? daily.status : free.status

  const yt = useYouTubePlayer({ videoId: track.youtubeId, startSeconds: track.startSeconds })

  const stage = Math.min(curGuesses.length, MAX_ATTEMPTS - 1)
  const playing = curStatus === 'playing'
  const lastStage = curGuesses.length === MAX_ATTEMPTS - 1

  const persistDaily = useCallback(
    (next: DailyState, g: GenreId) => {
      setDaily(next)
      storage.set(`daily:${dateStr}:${g}`, next)
      if (next.status !== 'playing') setStats(recordResult(next, g))
    },
    [dateStr],
  )

  const closeHelp = useCallback(() => {
    setShowHelp(false)
    storage.set('seenHelp', true)
  }, [])

  const showToast = useCallback((msg: string) => {
    setToast(msg)
    window.setTimeout(() => setToast(null), 2500)
  }, [])

  const selectGenre = (g: GenreId) => {
    if (g === genre) return
    yt.stop()
    setStaged(null)
    storage.set('genre', g)
    const pool = tracksOf(g)
    setGenre(g)
    setDaily(loadDaily(dateStr, g, pickDailyTrack(pool, dateStr, g)))
    setFree(loadFreeSession(g, pool))
    setStats(loadStats(g))
  }

  const switchMode = (m: Mode) => {
    if (m === mode) return
    yt.stop()
    setStaged(null)
    setMode(m)
  }

  const applyEntry = (entry: GuessEntry) => {
    if (!playing) return
    yt.stop()
    const guesses = [...curGuesses, entry]
    const correct = entry.kind === 'guess' && entry.trackId === track.id
    const status: GameStatus = correct ? 'won' : guesses.length >= MAX_ATTEMPTS ? 'lost' : 'playing'
    if (mode === 'daily') {
      persistDaily({ ...daily, guesses, status }, genre)
    } else {
      const next = { ...free, guesses, status }
      setFree(next)
      saveFreeSession(genre, next)
    }
    setStaged(null)
    if (correct) {
      setAnnounce('Doğru! Şarkıyı buldun.')
    } else if (status === 'lost') {
      setAnnounce('Oyun bitti.')
    } else {
      setAnnounce(
        entry.kind === 'skip'
          ? `Pas geçildi. ${CLIP_STAGES[guesses.length]} saniye açıldı.`
          : `Yanlış tahmin. ${CLIP_STAGES[guesses.length]} saniye açıldı.`,
      )
      if (entry.kind === 'guess') {
        setShake(true)
        window.setTimeout(() => setShake(false), 450)
      }
    }
  }

  const submitGuess = () => {
    if (staged === null) return
    applyEntry({ kind: 'guess', trackId: staged.track.id, label: staged.label })
  }

  const nextFreeSong = () => {
    yt.stop()
    setStaged(null)
    setAnnounce('Yeni şarkı yüklendi.')
    setFree(advanceFreeSession(genre, genreTracks, free))
  }

  const togglePlay = useCallback(() => {
    if (yt.phase === 'playing') yt.stop()
    else yt.playClip(CLIP_STAGES[stage])
  }, [yt, stage])

  // oynatıcı yeni şarkı için yeniden oluştuğunda ses seviyesini geri yükle
  useEffect(() => {
    if (yt.phase === 'ready') yt.setVolume(volumeRef.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [yt.phase, yt.setVolume])

  // aktif kategori çipini görünür alana kaydır
  useEffect(() => {
    chipsRef.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' })
  }, [genre])

  // Space = çal/durdur (input veya butona odaklı değilken)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.code !== 'Space' || showHelp || !playing) return
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'BUTTON') return
      e.preventDefault()
      togglePlay()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [togglePlay, showHelp, playing])

  const handleShare = async () => {
    const outcome = await shareResult(buildShareText(daily, genreLabel))
    if (outcome === 'copied') showToast('Sonuç panoya kopyalandı')
    else if (outcome === 'failed') showToast('Paylaşım yapılamadı')
  }

  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-4 pb-8">
      <header className="flex items-center justify-between py-4">
        <div className="flex items-center gap-2.5">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-ember-500 font-display text-lg font-bold text-night-950">
            ♪
          </span>
          <div>
            <h1 className="font-display text-lg leading-tight font-bold tracking-wide">
              İLK NOTA
            </h1>
            <p className="text-[11px] leading-tight text-night-400">
              {mode === 'daily'
                ? `Gün #${day} · ${genreLabel}`
                : `Sınırsız · ${genreLabel} · ${free.pos + 1}/${free.queue.length}`}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <input
            type="range"
            min={0}
            max={100}
            defaultValue={100}
            aria-label="Ses seviyesi"
            onChange={(e) => {
              volumeRef.current = Number(e.target.value)
              yt.setVolume(volumeRef.current)
            }}
            className="hidden w-20 accent-ember-500 sm:block"
          />
          <button
            type="button"
            aria-label={yt.muted ? 'Sesi aç' : 'Sesi kapat'}
            aria-pressed={yt.muted}
            onClick={yt.toggleMute}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-night-300 hover:bg-night-800 hover:text-night-100"
          >
            {yt.muted ? (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3Zm13.6 3 2.7-2.7-1.4-1.4-2.7 2.7-2.7-2.7-1.4 1.4 2.7 2.7-2.7 2.7 1.4 1.4 2.7-2.7 2.7 2.7 1.4-1.4-2.7-2.7Z" />
              </svg>
            ) : (
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
                <path d="M3 9v6h4l5 5V4L7 9H3Zm13.5 3A4.5 4.5 0 0 0 14 8v8a4.5 4.5 0 0 0 2.5-4Zm-2.5-8.8v2.06A6.5 6.5 0 0 1 18.5 12 6.5 6.5 0 0 1 14 18.74v2.06A8.5 8.5 0 0 0 20.5 12 8.5 8.5 0 0 0 14 3.2Z" />
              </svg>
            )}
          </button>
          <button
            type="button"
            aria-label="Nasıl oynanır"
            onClick={() => setShowHelp(true)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-full text-night-300 hover:bg-night-800 hover:text-night-100"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5 fill-current">
              <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20Zm0 18a8 8 0 1 1 0-16 8 8 0 0 1 0 16Zm0-4.5a1.25 1.25 0 1 0 0 2.5 1.25 1.25 0 0 0 0-2.5ZM12 6a3.5 3.5 0 0 0-3.5 3.5h2a1.5 1.5 0 1 1 3 0c0 .83-.55 1.24-1.32 1.8-.83.62-1.68 1.35-1.68 2.7v.5h2V14c0-.57.4-.92 1.13-1.46.86-.64 1.87-1.44 1.87-3.04A3.5 3.5 0 0 0 12 6Z" />
            </svg>
          </button>
        </div>
      </header>

      <div
        ref={chipsRef}
        role="tablist"
        aria-label="Kategori"
        className="scrollbar-none -mx-4 mb-3 flex gap-2 overflow-x-auto px-4 pb-1"
      >
        {GENRES.map((g) => {
          const active = g.id === genre
          const available = tracksOf(g.id).length > 0
          return (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={active}
              disabled={!available}
              onClick={() => selectGenre(g.id)}
              className={`flex h-9 shrink-0 cursor-pointer items-center gap-1.5 rounded-full border px-3.5 font-display text-[13px] font-semibold whitespace-nowrap transition ${
                active
                  ? 'border-ember-500 bg-ember-500/15 text-ember-300'
                  : 'border-night-700 bg-night-850 text-night-300 hover:border-night-500 hover:text-night-100'
              } disabled:opacity-30`}
            >
              <span aria-hidden="true">{g.emoji}</span>
              {g.label}
            </button>
          )
        })}
      </div>

      <div
        role="tablist"
        aria-label="Oyun modu"
        className="mb-5 flex rounded-2xl border border-night-700 bg-night-850 p-1"
      >
        {(
          [
            ['daily', 'Günün Şarkısı'],
            ['free', 'Sınırsız Oyna'],
          ] as const
        ).map(([m, label]) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`h-10 flex-1 cursor-pointer rounded-xl font-display text-sm font-semibold transition ${
              mode === m
                ? 'bg-night-600 text-night-100 shadow-sm'
                : 'text-night-400 hover:text-night-200'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      <main className="flex flex-1 flex-col gap-6">
        <AttemptRows state={{ guesses: curGuesses, status: curStatus }} />

        {playing ? (
          <>
            <div className="flex flex-1 flex-col items-center justify-center py-2">
              {yt.phase === 'error' ? (
                <div className="flex w-full flex-col items-center gap-3 rounded-2xl border border-ember-600/40 bg-ember-600/10 px-5 py-6 text-center">
                  <p className="text-sm font-medium text-night-100">Parça yüklenemedi</p>
                  <p className="text-[13px] text-night-300">
                    Bağlantını kontrol edip yeniden dene — bu sırada pas geçebilir ya da
                    tahminde bulunabilirsin.
                  </p>
                  <button
                    type="button"
                    onClick={yt.retry}
                    className="cursor-pointer rounded-xl bg-ember-500 px-5 py-2.5 font-display text-sm font-bold text-night-950 hover:bg-ember-400"
                  >
                    Yeniden dene
                  </button>
                </div>
              ) : (
                <PlayerDial phase={yt.phase} elapsed={yt.elapsed} stage={stage} onToggle={togglePlay} />
              )}
            </div>

            <div className={`flex flex-col gap-3 ${shake ? 'animate-shake' : ''}`}>
              <SearchBox
                tracks={genreTracks}
                staged={staged}
                onStage={setStaged}
                onSubmit={submitGuess}
                disabled={!playing}
              />
              <button
                type="button"
                onClick={() => (staged !== null ? submitGuess() : applyEntry({ kind: 'skip' }))}
                className={`h-13 w-full cursor-pointer rounded-2xl font-display text-base font-bold transition active:scale-[0.99] ${
                  staged !== null
                    ? 'bg-ember-500 text-night-950 hover:bg-ember-400'
                    : lastStage
                      ? 'border border-ember-600/50 text-ember-400 hover:bg-ember-600/10'
                      : 'border border-night-600 text-night-300 hover:bg-night-800'
                }`}
              >
                {staged !== null ? 'Tahmin Et' : lastStage ? 'Pes Et' : 'Pas Geç'}
              </button>
            </div>
          </>
        ) : mode === 'daily' ? (
          <ResultPanel state={daily} track={dailyTrack} stats={stats} onShare={handleShare} />
        ) : (
          <FreeResultPanel
            state={{ guesses: free.guesses, status: free.status }}
            track={freeTrack}
            onNext={nextFreeSong}
          />
        )}
      </main>

      <p className="sr-only" role="status" aria-live="polite">
        {announce}
      </p>

      {/* Gizli ses çalar — cevap çözülmeden asla görünmez */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed bottom-0 left-0 h-px w-px overflow-hidden opacity-0"
      >
        <div ref={yt.hostRef} />
      </div>

      {toast !== null && (
        <div className="animate-rise fixed bottom-6 left-1/2 z-40 -translate-x-1/2 rounded-full bg-night-100 px-5 py-2.5 text-sm font-medium text-night-950 shadow-xl">
          {toast}
        </div>
      )}

      {showHelp && <HelpModal onClose={closeHelp} />}
    </div>
  )
}
