import { useEffect, useRef } from 'react'

/** "Nasıl Oynanır" dialog — auto-opens on first visit, like Songless. */
export function HelpModal({ onClose }: { onClose: () => void }) {
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    closeRef.current?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-title"
        onClick={(e) => e.stopPropagation()}
        className="animate-rise w-full max-w-md rounded-3xl border border-night-600 bg-night-850 p-6 shadow-2xl"
      >
        <div className="mb-4 flex items-start justify-between">
          <h2 id="help-title" className="font-display text-xl font-bold">
            Nasıl oynanır?
          </h2>
          <button
            ref={closeRef}
            type="button"
            aria-label="Kapat"
            onClick={onClose}
            className="grid h-8 w-8 cursor-pointer place-items-center rounded-full text-night-400 hover:bg-night-700 hover:text-night-100"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4 fill-current">
              <path d="M10 8.6 14.6 4 16 5.4 11.4 10l4.6 4.6-1.4 1.4L10 11.4 5.4 16 4 14.6 8.6 10 4 5.4 5.4 4 10 8.6Z" />
            </svg>
          </button>
        </div>
        <ol className="flex flex-col gap-3.5 text-[15px] leading-relaxed text-night-300">
          {[
            'Bir kategori seç — rap, pop, arabesk, türkü… Her kategorinin kendi günlük şarkısı var.',
            'Çal tuşuna bas, şarkının ilk 0,1 saniyesini dinle; sonra şarkıyı veya sanatçıyı arayıp listeden seç.',
            'Her yanlış tahmin ya da pas, daha uzun bir bölüm açar: 0,1 → 0,5 → 2 → 4 → 8 → 15 saniye.',
            'Toplam 6 hakkın var. Sınırsız modda ise arka arkaya istediğin kadar şarkı çözebilirsin!',
          ].map((step, i) => (
            <li key={i} className="flex gap-3">
              <span className="font-display mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-ember-500/15 text-xs font-bold text-ember-400">
                {i + 1}
              </span>
              {step}
            </li>
          ))}
        </ol>
        <p className="mt-5 rounded-xl bg-night-800 px-4 py-3 text-[13px] text-night-400">
          Her gün gece yarısı yeni bir şarkı gelir. Herkes aynı gün aynı şarkıyı çözer.
        </p>
      </div>
    </div>
  )
}
