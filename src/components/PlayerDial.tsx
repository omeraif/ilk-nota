import type { PlayerPhase } from '../hooks/useYouTubePlayer'
import { CLIP_STAGES } from '../types'

interface Props {
  phase: PlayerPhase
  elapsed: number
  /** index of the current attempt (0-based) — defines the unlocked duration */
  stage: number
  onToggle: () => void
}

const R = 52
const CIRC = 2 * Math.PI * R

function fmtSec(s: number): string {
  return s < 1 ? `${s}`.replace('.', ',') : `${s}`
}

export function PlayerDial({ phase, elapsed, stage, onToggle }: Props) {
  const unlocked = CLIP_STAGES[Math.min(stage, CLIP_STAGES.length - 1)]
  const progress = phase === 'playing' ? Math.min(elapsed / unlocked, 1) : 0
  const disabled = phase === 'loading' || phase === 'error'

  return (
    <div className="flex flex-col items-center gap-5">
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        aria-label={
          phase === 'playing' ? 'Durdur' : `Çal — ${fmtSec(unlocked)} saniyelik bölüm`
        }
        className={`group relative grid h-32 w-32 place-items-center rounded-full bg-night-800 transition-transform duration-150 select-none ${
          disabled ? 'opacity-40' : 'hover:scale-[1.03] active:scale-95 cursor-pointer'
        } ${phase === 'ready' ? 'animate-glow' : ''}`}
      >
        <svg viewBox="0 0 120 120" className="absolute inset-0 h-full w-full -rotate-90">
          <circle cx="60" cy="60" r={R} fill="none" stroke="var(--color-night-600)" strokeWidth="5" />
          <circle
            cx="60"
            cy="60"
            r={R}
            fill="none"
            stroke="var(--color-ember-500)"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={CIRC}
            strokeDashoffset={CIRC * (1 - progress)}
            style={{ transition: phase === 'playing' ? 'none' : 'stroke-dashoffset 0.3s' }}
          />
        </svg>
        {phase === 'loading' ? (
          <span className="h-7 w-7 animate-spin rounded-full border-2 border-night-600 border-t-ember-500" />
        ) : phase === 'playing' ? (
          <span className="h-7 w-7 rounded-[4px] bg-ember-400" />
        ) : (
          <svg viewBox="0 0 24 24" className="ml-1.5 h-10 w-10 fill-night-100 transition group-hover:fill-ember-300">
            <path d="M8 5.14v13.72c0 .8.87 1.3 1.56.88l10.86-6.86a1.03 1.03 0 0 0 0-1.76L9.56 4.26A1.03 1.03 0 0 0 8 5.14Z" />
          </svg>
        )}
      </button>

      <p className="font-display text-sm font-medium tracking-wide text-night-300" aria-live="polite">
        <span className="text-ember-400">{fmtSec(unlocked)} saniye</span> açık
      </p>

      <div className="flex w-full max-w-sm items-end justify-between gap-1.5" aria-hidden="true">
        {CLIP_STAGES.map((sec, i) => {
          const isPast = i < stage
          const isCurrent = i === stage
          return (
            <div key={sec} className="flex flex-1 flex-col items-center gap-1.5">
              <div
                className={`h-1.5 w-full rounded-full transition-colors ${
                  isCurrent ? 'bg-ember-500' : isPast ? 'bg-ember-500/30' : 'bg-night-700'
                }`}
              />
              <span
                className={`font-display text-[10px] tabular-nums ${
                  isCurrent ? 'font-semibold text-ember-400' : 'text-night-400'
                }`}
              >
                {fmtSec(sec)}s
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
