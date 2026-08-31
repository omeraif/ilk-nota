import type { Track } from '../types'

/** Day 1 of İlk Nota. */
const LAUNCH_DATE = '2026-08-29'

/** Local calendar date as YYYY-MM-DD. */
export function localDateStr(d: Date = new Date()): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** Puzzle number for a local date (launch day = #1). */
export function dayNumber(dateStr: string): number {
  const ms = Date.parse(`${dateStr}T12:00:00`) - Date.parse(`${LAUNCH_DATE}T12:00:00`)
  return Math.round(ms / 86_400_000) + 1
}

/** Deterministic string hash (xmur3-style) — same date ⇒ same song for everyone. */
function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  h = Math.imul(h ^ (h >>> 16), 2246822507)
  h = Math.imul(h ^ (h >>> 13), 3266489909)
  return (h ^= h >>> 16) >>> 0
}

export function pickDailyTrack(tracks: Track[], dateStr: string, salt = ''): Track {
  return tracks[hashSeed(`ilknota:${salt}:${dateStr}`) % tracks.length]
}

/** Milliseconds until next local midnight (next puzzle). */
export function msUntilNextPuzzle(now: Date = new Date()): number {
  const next = new Date(now)
  next.setHours(24, 0, 0, 0)
  return next.getTime() - now.getTime()
}
