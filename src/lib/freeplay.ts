import type { GameStatus, GenreId, GuessEntry, Track } from '../types'
import { storage } from './storage'

/**
 * Sınırsız mod oturumu (kategori başına ayrı): karıştırılmış bir "deste"
 * sırayla oynanır — kategorideki her şarkı bir kez gelmeden tekrar olmaz;
 * deste bitince yeniden karılır. Yalnızca aktif oturum localStorage'da tutulur.
 */
export interface FreeSession {
  queue: string[]
  pos: number
  guesses: GuessEntry[]
  status: GameStatus
}

const key = (genre: GenreId) => `free:session:${genre}`

function shuffle(ids: string[]): string[] {
  const a = [...ids]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

export function newFreeSession(genre: GenreId, pool: Track[], avoidFirstId?: string): FreeSession {
  let queue = shuffle(pool.map((t) => t.id))
  // yeni destenin ilk şarkısı az önce çalanla aynı olmasın
  if (avoidFirstId !== undefined && queue.length > 1 && queue[0] === avoidFirstId) {
    queue = [...queue.slice(1), queue[0]]
  }
  const session: FreeSession = { queue, pos: 0, guesses: [], status: 'playing' }
  saveFreeSession(genre, session)
  return session
}

export function loadFreeSession(genre: GenreId, pool: Track[]): FreeSession {
  const saved = storage.get<FreeSession | null>(key(genre), null)
  const known = new Set(pool.map((t) => t.id))
  if (
    saved !== null &&
    Array.isArray(saved.queue) &&
    saved.queue.length > 0 &&
    saved.queue.every((id) => known.has(id)) &&
    Number.isInteger(saved.pos) &&
    saved.pos >= 0 &&
    saved.pos < saved.queue.length
  ) {
    return saved
  }
  return newFreeSession(genre, pool)
}

export function saveFreeSession(genre: GenreId, s: FreeSession): void {
  storage.set(key(genre), s)
}

/** Sıradaki şarkıya geç; deste bittiyse yeniden karıştır. */
export function advanceFreeSession(genre: GenreId, pool: Track[], s: FreeSession): FreeSession {
  const nextPos = s.pos + 1
  if (nextPos >= s.queue.length) return newFreeSession(genre, pool, s.queue[s.pos])
  const next: FreeSession = { ...s, pos: nextPos, guesses: [], status: 'playing' }
  saveFreeSession(genre, next)
  return next
}
