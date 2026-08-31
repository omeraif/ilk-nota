import type { Track } from '../types'
import { normalizeTr } from './normalize'

export interface Suggestion {
  track: Track
  /** display label, "Title - Artist" */
  label: string
}

interface Indexed {
  track: Track
  label: string
  normTitle: string
  normArtist: string
  /** every searchable phrase, normalized: title, artist(s), "artist title", "title artist", aliases */
  haystack: string
}

export function trackLabel(t: Track): string {
  return `${t.title} - ${t.artist}`
}

export function buildIndex(tracks: Track[]): Indexed[] {
  return tracks.map((t) => {
    const artists = [t.artist, ...t.featuring]
    const phrases = [
      t.title,
      ...artists,
      ...artists.map((a) => `${a} ${t.title}`),
      ...artists.map((a) => `${t.title} ${a}`),
      ...t.aliases,
      ...t.aliases.map((a) => `${a} ${t.title}`),
    ]
    return {
      track: t,
      label: trackLabel(t),
      normTitle: normalizeTr(t.title),
      normArtist: normalizeTr(artists.join(' ')),
      haystack: normalizeTr(phrases.join(' | ')),
    }
  })
}

const MAX_SUGGESTIONS = 10
const MIN_QUERY = 2

/**
 * Substring matching over title, artist, combined orders and aliases —
 * every query token must appear somewhere in the track's haystack.
 */
export function searchTracks(index: Indexed[], query: string): Suggestion[] {
  const norm = normalizeTr(query)
  if (norm.length < MIN_QUERY) return []
  const tokens = norm.split(' ')

  const scored: Array<{ s: Suggestion; score: number }> = []
  for (const item of index) {
    if (!tokens.every((tok) => item.haystack.includes(tok))) continue
    let score = 1
    if (item.normTitle.startsWith(norm)) score += 4
    else if (item.normTitle.includes(norm)) score += 2
    if (item.normArtist.startsWith(norm)) score += 3
    else if (item.normArtist.includes(norm)) score += 1.5
    if (tokens.some((tok) => item.normTitle.split(' ').some((w) => w.startsWith(tok)))) score += 1
    scored.push({ s: { track: item.track, label: item.label }, score })
  }
  scored.sort((a, b) => b.score - a.score || a.s.label.localeCompare(b.s.label, 'tr'))
  return scored.slice(0, MAX_SUGGESTIONS).map((x) => x.s)
}
