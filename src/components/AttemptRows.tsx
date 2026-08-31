import { MAX_ATTEMPTS, type DailyState } from '../types'

/** Six fixed attempt slots — skips, wrong guesses and the winning guess. */
export function AttemptRows({ state }: { state: Pick<DailyState, 'guesses' | 'status'> }) {
  return (
    <ol className="flex w-full flex-col gap-2" aria-label="Tahminler">
      {Array.from({ length: MAX_ATTEMPTS }, (_, i) => {
        const g = state.guesses[i]
        const isCurrent = state.status === 'playing' && i === state.guesses.length
        const isWin = state.status === 'won' && i === state.guesses.length - 1
        let content: React.ReactNode
        let cls = 'border-night-700/60 bg-night-850/50 text-night-400'
        if (g === undefined) {
          content = <span className="opacity-40">·</span>
          if (isCurrent) cls = 'border-ember-500/50 bg-night-800 text-night-300'
        } else if (g.kind === 'skip') {
          content = <span className="italic">Pas geçildi</span>
          cls = 'border-night-700 bg-night-800/80 text-night-400 animate-rise'
        } else if (isWin) {
          content = <span className="font-medium text-lime-500">{g.label}</span>
          cls = 'border-lime-500/40 bg-lime-500/10 animate-rise'
        } else {
          content = <span className="text-night-100">{g.label}</span>
          cls = 'border-ember-600/40 bg-ember-600/10 animate-rise'
        }
        return (
          <li
            key={i}
            className={`flex h-11 items-center gap-3 truncate rounded-xl border px-3.5 text-sm ${cls}`}
          >
            <span
              className={`font-display text-[11px] font-semibold tabular-nums ${
                isCurrent ? 'text-ember-400' : g === undefined ? 'text-night-600' : 'text-night-400'
              }`}
            >
              {i + 1}
            </span>
            <span className="truncate">{content}</span>
            {g !== undefined && g.kind === 'guess' && !isWin && (
              <svg viewBox="0 0 20 20" className="ml-auto h-4 w-4 shrink-0 fill-ember-500">
                <path d="M10 8.6 14.6 4 16 5.4 11.4 10l4.6 4.6-1.4 1.4L10 11.4 5.4 16 4 14.6 8.6 10 4 5.4 5.4 4 10 8.6Z" />
              </svg>
            )}
            {isWin && (
              <svg viewBox="0 0 20 20" className="ml-auto h-4 w-4 shrink-0 fill-lime-500">
                <path d="m8.3 13.6-3-3L4 11.9l4.3 4.3 8-8-1.3-1.3-6.7 6.7Z" />
              </svg>
            )}
          </li>
        )
      })}
    </ol>
  )
}
