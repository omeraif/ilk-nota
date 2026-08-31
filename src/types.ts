export const GENRES = [
  { id: 'rap', label: 'Rap', emoji: '🎤' },
  { id: 'pop', label: 'Pop', emoji: '✨' },
  { id: 'rock', label: 'Rock', emoji: '🎸' },
  { id: 'arabesk', label: 'Arabesk', emoji: '🥀' },
  { id: 'doksanlar', label: "90'lar", emoji: '📼' },
  { id: 'ikibinler', label: "2000'ler", emoji: '💿' },
  { id: 'turku', label: 'Türkü', emoji: '🪕' },
  { id: 'sanat', label: 'Sanat Müziği', emoji: '🎻' },
  { id: 'slow', label: 'Slow', emoji: '🌙' },
  { id: 'indie', label: 'İndie', emoji: '🧿' },
] as const

export type GenreId = (typeof GENRES)[number]['id']

export interface Track {
  /** stable id, kebab-case "artist-title" */
  id: string
  title: string
  artist: string
  /** additional credited artists */
  featuring: string[]
  /** alternative spellings / short names fans might type */
  aliases: string[]
  genre: GenreId
  year: number
  youtubeId: string
  thumbnail: string
  /** where the recognizable part of the song starts, in seconds */
  startSeconds: number
}

export type GuessEntry =
  | { kind: 'skip' }
  | { kind: 'guess'; trackId: string; label: string }

export type GameStatus = 'playing' | 'won' | 'lost'

export interface DailyState {
  date: string
  day: number
  trackId: string
  guesses: GuessEntry[]
  status: GameStatus
}

export interface Stats {
  played: number
  wins: number
  streak: number
  maxStreak: number
  /** wins by attempt count "1".."6", losses under "X" */
  dist: Record<string, number>
  lastWinDate: string | null
}

/** Snippet durations unlocked per attempt — measured 1:1 from Songless. */
export const CLIP_STAGES = [0.1, 0.5, 2, 4, 8, 15] as const
export const MAX_ATTEMPTS = CLIP_STAGES.length

export const EMPTY_STATS: Stats = {
  played: 0,
  wins: 0,
  streak: 0,
  maxStreak: 0,
  dist: { '1': 0, '2': 0, '3': 0, '4': 0, '5': 0, '6': 0, X: 0 },
  lastWinDate: null,
}
