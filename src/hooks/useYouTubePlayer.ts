import { useCallback, useEffect, useRef, useState } from 'react'

export type PlayerPhase = 'loading' | 'ready' | 'playing' | 'error'

interface Options {
  videoId: string
  startSeconds: number
}

declare global {
  interface Window {
    onYouTubeIframeAPIReady?: () => void
    YT: typeof YT
  }
}

let apiPromise: Promise<void> | null = null
function loadApi(): Promise<void> {
  if (window.YT?.Player) return Promise.resolve()
  if (!apiPromise) {
    apiPromise = new Promise<void>((resolve, reject) => {
      const prev = window.onYouTubeIframeAPIReady
      window.onYouTubeIframeAPIReady = () => {
        prev?.()
        resolve()
      }
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.onerror = () => reject(new Error('yt-api-load-failed'))
      document.head.appendChild(tag)
      window.setTimeout(() => reject(new Error('yt-api-timeout')), 12_000)
    })
  }
  return apiPromise
}

/**
 * Hidden 1×1 YouTube player driving the snippet loop.
 * playClip(duration) seeks to the track's intro point, plays exactly
 * `duration` seconds and pauses. Single player instance ⇒ audio never overlaps.
 */
export function useYouTubePlayer({ videoId, startSeconds }: Options) {
  const hostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YT.Player | null>(null)
  const pollRef = useRef<number | null>(null)
  const watchdogRef = useRef<number | null>(null)
  const [phase, setPhase] = useState<PlayerPhase>('loading')
  const [elapsed, setElapsed] = useState(0)
  const [muted, setMuted] = useState(false)
  const mutedRef = useRef(false)
  const phaseRef = useRef(phase)
  phaseRef.current = phase

  const clearTimers = useCallback(() => {
    if (pollRef.current !== null) window.clearInterval(pollRef.current)
    if (watchdogRef.current !== null) window.clearTimeout(watchdogRef.current)
    pollRef.current = null
    watchdogRef.current = null
  }, [])

  useEffect(() => {
    let cancelled = false
    setPhase('loading')
    setElapsed(0)
    loadApi()
      .then(() => {
        if (cancelled || !hostRef.current) return
        playerRef.current = new window.YT.Player(hostRef.current, {
          width: 1,
          height: 1,
          videoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            rel: 0,
            iv_load_policy: 3,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e) => {
              if (cancelled) return
              // YouTube titles the iframe with the video name — mask it so the
              // answer never appears in an accessible name or tooltip.
              try {
                const frame = e.target.getIframe()
                frame.title = 'Ses çalar'
                frame.setAttribute('tabindex', '-1')
              } catch {
                /* ignore */
              }
              // oynatıcı yeniden oluştuğunda sessize alma durumunu koru
              if (mutedRef.current) e.target.mute()
              e.target.cueVideoById({ videoId, startSeconds })
              setPhase('ready')
            },
            onError: () => {
              if (!cancelled) setPhase('error')
            },
          },
        })
      })
      .catch(() => {
        if (!cancelled) setPhase('error')
      })
    return () => {
      cancelled = true
      clearTimers()
      playerRef.current?.destroy()
      playerRef.current = null
    }
    // player is created once per mounted track
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [videoId])

  const stop = useCallback(() => {
    clearTimers()
    const p = playerRef.current
    if (p && typeof p.pauseVideo === 'function') {
      try {
        p.pauseVideo()
      } catch {
        /* player already gone */
      }
    }
    setElapsed(0)
    setPhase((cur) => (cur === 'playing' ? 'ready' : cur))
  }, [clearTimers])

  const playClip = useCallback(
    (duration: number, onDone?: () => void) => {
      const p = playerRef.current
      if (!p || phaseRef.current === 'error' || phaseRef.current === 'loading') return
      clearTimers()
      setElapsed(0)
      setPhase('playing')
      try {
        p.seekTo(startSeconds, true)
        p.playVideo()
      } catch {
        setPhase('error')
        return
      }
      const finish = () => {
        clearTimers()
        try {
          p.pauseVideo()
        } catch {
          /* ignore */
        }
        setElapsed(0)
        setPhase('ready')
        onDone?.()
      }
      pollRef.current = window.setInterval(() => {
        let t = 0
        try {
          t = p.getCurrentTime() - startSeconds
        } catch {
          return
        }
        if (t >= duration) {
          finish()
        } else if (t >= 0) {
          setElapsed(Math.min(t, duration))
        }
      }, 25)
      // watchdog: if buffering stalls well past the clip length, fail soft
      watchdogRef.current = window.setTimeout(() => {
        const state = safeState(p)
        if (state !== window.YT?.PlayerState.PLAYING) {
          clearTimers()
          setElapsed(0)
          setPhase('error')
        } else {
          finish()
        }
      }, (duration + 8) * 1000)
    },
    [clearTimers, startSeconds],
  )

  const toggleMute = useCallback(() => {
    const p = playerRef.current
    if (!p) return
    setMuted((m) => {
      try {
        if (m) p.unMute()
        else p.mute()
      } catch {
        /* ignore */
      }
      mutedRef.current = !m
      return !m
    })
  }, [])

  const setVolume = useCallback((v: number) => {
    try {
      playerRef.current?.setVolume(v)
    } catch {
      /* ignore */
    }
  }, [])

  const retry = useCallback(() => {
    const p = playerRef.current
    setPhase(p ? 'ready' : 'error')
    if (p) {
      try {
        p.cueVideoById({ videoId, startSeconds })
      } catch {
        setPhase('error')
      }
    }
  }, [videoId, startSeconds])

  return { hostRef, phase, elapsed, muted, playClip, stop, toggleMute, setVolume, retry }
}

function safeState(p: YT.Player): number {
  try {
    return p.getPlayerState()
  } catch {
    return -1
  }
}
