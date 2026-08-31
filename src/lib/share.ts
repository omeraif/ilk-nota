import type { DailyState } from '../types'

export const SITE_URL = 'https://omeraif.github.io/ilk-nota/'

/** One emoji per used attempt — ⬜ skip, 🟥 wrong, 🟩 correct (Songless format). */
export function attemptEmojis(state: Pick<DailyState, 'guesses' | 'status'>): string {
  return state.guesses
    .map((g, i) => {
      if (g.kind === 'skip') return '⬜'
      const correct = state.status === 'won' && i === state.guesses.length - 1
      return correct ? '🟩' : '🟥'
    })
    .join('')
}

export function buildShareText(state: DailyState, genreLabel: string): string {
  const squares = attemptEmojis(state)
  const headline =
    state.status === 'won'
      ? `Günün ${genreLabel} şarkısını ${state.guesses.length}. denemede buldum! 🎧 [İlk Nota #${state.day}]`
      : `Bugünkü ${genreLabel} şarkısını bulamadım 💀 [İlk Nota #${state.day}]`
  return `${headline}\n\n${squares}\n\nSen de dene: ${SITE_URL}`
}

/** Native share on mobile, clipboard elsewhere. Returns how it was delivered. */
export async function shareResult(text: string): Promise<'shared' | 'copied' | 'failed'> {
  if (navigator.share) {
    try {
      await navigator.share({ text })
      return 'shared'
    } catch (err) {
      if ((err as DOMException).name === 'AbortError') return 'failed'
    }
  }
  try {
    await navigator.clipboard.writeText(text)
    return 'copied'
  } catch {
    return 'failed'
  }
}
