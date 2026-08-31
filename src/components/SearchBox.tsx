import { useEffect, useMemo, useRef, useState } from 'react'
import { buildIndex, searchTracks, type Suggestion } from '../lib/search'
import type { Track } from '../types'

interface Props {
  tracks: Track[]
  staged: Suggestion | null
  onStage: (s: Suggestion | null) => void
  onSubmit: () => void
  disabled: boolean
}

/**
 * ARIA combobox reproducing Songless's answer flow: type → pick a suggestion
 * (stages it) → confirm with the submit button / Enter. Free text can never
 * be submitted.
 */
export function SearchBox({ tracks, staged, onStage, onSubmit, disabled }: Props) {
  const index = useMemo(() => buildIndex(tracks), [tracks])
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [highlight, setHighlight] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const results = useMemo(
    () => (open && staged === null ? searchTracks(index, query) : []),
    [index, query, open, staged],
  )

  useEffect(() => {
    setHighlight(0)
  }, [query])

  useEffect(() => {
    if (listRef.current === null) return
    listRef.current
      .querySelector(`[data-idx="${highlight}"]`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [highlight])

  const stage = (s: Suggestion) => {
    onStage(s)
    setQuery('')
    setOpen(false)
  }

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      if (open) {
        e.preventDefault()
        e.stopPropagation()
        setOpen(false)
      }
      return
    }
    if (results.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setHighlight((h) => (h + 1) % results.length)
        return
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setHighlight((h) => (h - 1 + results.length) % results.length)
        return
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        stage(results[highlight])
        return
      }
    }
    if (e.key === 'Enter' && staged !== null) {
      e.preventDefault()
      onSubmit()
    }
  }

  return (
    <div className="relative w-full">
      {results.length > 0 && (
        <ul
          ref={listRef}
          id="song-listbox"
          role="listbox"
          aria-label="Şarkı önerileri"
          className="absolute bottom-full z-20 mb-2 max-h-72 w-full overflow-y-auto rounded-2xl border border-night-600 bg-night-850/95 shadow-2xl shadow-black/60 backdrop-blur"
        >
          {results.map((s, i) => (
            <li
              key={s.track.id}
              id={`song-opt-${i}`}
              data-idx={i}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => stage(s)}
              onMouseMove={() => setHighlight(i)}
              className={`flex cursor-pointer items-center gap-3 px-3.5 py-2.5 ${
                i === highlight ? 'bg-ember-500/15' : ''
              }`}
            >
              <img
                src={s.track.thumbnail}
                alt=""
                loading="lazy"
                className="h-9 w-9 shrink-0 rounded-lg object-cover"
              />
              <span className="min-w-0">
                <span className="block truncate text-sm font-medium text-night-100">
                  {s.track.title}
                </span>
                <span className="block truncate text-xs text-night-400">
                  {[s.track.artist, ...s.track.featuring].join(', ')}
                </span>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="relative">
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className="pointer-events-none absolute top-1/2 left-4 h-4 w-4 -translate-y-1/2 fill-night-400"
        >
          <path d="M8.5 3a5.5 5.5 0 0 1 4.38 8.82l3.65 3.65-1.06 1.06-3.65-3.65A5.5 5.5 0 1 1 8.5 3Zm0 1.5a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
        </svg>
        <input
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={results.length > 0}
          aria-controls="song-listbox"
          aria-activedescendant={results.length > 0 ? `song-opt-${highlight}` : undefined}
          aria-autocomplete="list"
          aria-label="Şarkı ara"
          autoComplete="off"
          autoCorrect="off"
          spellCheck={false}
          enterKeyHint="done"
          placeholder="Şarkı veya sanatçı ara…"
          disabled={disabled}
          value={staged !== null ? staged.label : query}
          onChange={(e) => {
            onStage(null)
            setQuery(e.target.value)
            setOpen(true)
          }}
          onFocus={() => setOpen(true)}
          onBlur={() => setOpen(false)}
          onKeyDown={handleKey}
          className={`h-13 w-full rounded-2xl border bg-night-800 pr-4 pl-11 text-[15px] text-night-100 placeholder:text-night-400 disabled:opacity-40 ${
            staged !== null ? 'border-ember-500/60' : 'border-night-600 focus:border-night-400'
          }`}
        />
        {staged !== null && (
          <button
            type="button"
            aria-label="Seçimi temizle"
            onClick={() => {
              onStage(null)
              inputRef.current?.focus()
            }}
            className="absolute top-1/2 right-3 grid h-7 w-7 -translate-y-1/2 cursor-pointer place-items-center rounded-full text-night-400 hover:bg-night-700 hover:text-night-100"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
              <path d="M10 8.6 14.6 4 16 5.4 11.4 10l4.6 4.6-1.4 1.4L10 11.4 5.4 16 4 14.6 8.6 10 4 5.4 5.4 4 10 8.6Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  )
}
