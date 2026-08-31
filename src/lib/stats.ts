import { EMPTY_STATS, type DailyState, type GenreId, type Stats } from '../types'
import { storage } from './storage'

/** İstatistikler kategori başına ayrı tutulur (Songless'ın playlist mantığı). */
const key = (genre: GenreId) => `stats:${genre}`

export function loadStats(genre: GenreId): Stats {
  return storage.get<Stats>(key(genre), EMPTY_STATS)
}

/**
 * Record a finished daily exactly once (called at the playing→won/lost
 * transition, which can only happen once per day thanks to persisted state).
 */
export function recordResult(state: DailyState, genre: GenreId): Stats {
  const prev = loadStats(genre)
  const won = state.status === 'won'
  const bucket = won ? String(state.guesses.length) : 'X'
  const yesterdayWin = prev.lastWinDate !== null && dayDiff(prev.lastWinDate, state.date) === 1
  const streak = won ? (yesterdayWin ? prev.streak + 1 : 1) : 0
  const next: Stats = {
    played: prev.played + 1,
    wins: prev.wins + (won ? 1 : 0),
    streak,
    maxStreak: Math.max(prev.maxStreak, streak),
    dist: { ...prev.dist, [bucket]: (prev.dist[bucket] ?? 0) + 1 },
    lastWinDate: won ? state.date : prev.lastWinDate,
  }
  storage.set(key(genre), next)
  return next
}

function dayDiff(a: string, b: string): number {
  return Math.round((Date.parse(`${b}T12:00:00`) - Date.parse(`${a}T12:00:00`)) / 86_400_000)
}
