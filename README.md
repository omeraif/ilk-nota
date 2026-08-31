# İlk Nota 🎧

Günün Türkçe şarkısını ilk notalarından tahmin et. Songless'ın oyun mekaniğinin Türkçe müzik için sadık bir uyarlaması — özgün marka, özgün arayüz.

**Canlı:** https://omeraif.github.io/ilk-nota/

## Oynanış

- **10 kategori** (Rap, Pop, Rock, Arabesk, 90'lar, 2000'ler, Türkü, Sanat Müziği, Slow, İndie), kategori başına 50 şarkı — toplam ~500 doğrulanmış şarkı.
- Her kategorinin **kendi günlük şarkısı** var (yerel gece yarısında yenilenir, herkese aynı şarkı).
- 6 hak; açılan bölüm süreleri: **0,1 → 0,5 → 2 → 4 → 8 → 15 saniye** (Songless ile birebir).
- Yanlış tahmin de pas da bir sonraki süreyi açar. Son hakta "Pas Geç" yerine "Pes Et" görünür.
- Öneriden seç → "Tahmin Et" ile onayla. Serbest metin asla tahmin sayılmaz.
- **Sınırsız Oyna**: aynı mekaniklerle arka arkaya rastgele şarkı (kategori başına ayrı "deste"; deste bitmeden şarkı tekrar etmez). "Sonraki Şarkı" ile hemen devam.
- Sonuç: reveal, kategori bazlı istatistikler/seri/dağılım, geri sayım ve emoji paylaşımı (⬜ pas, 🟥 yanlış, 🟩 doğru) + site linki.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b
npm run build      # üretim derlemesi -> dist/  (base: /ilk-nota/)
npm run preview    # dist/ önizleme
```

Dağıtım: GitHub Pages (`gh-pages` dalı `dist/` içeriğidir). Sunucu/hesap/veritabanı yok; tüm ilerleme `localStorage`'da.

## Şarkı ekleme / katalog

Katalog `src/data/tracks.ts` dosyasındadır ve **`scripts/generate-tracks.mjs` tarafından üretilir**:

1. `.catalogue/<kategori>.json` dosyasına kayıt ekleyin:
   `{"title":"...","artist":"...","featuring":[],"aliases":[],"year":2005,"videoId":"...","channel":"..."}`
2. videoId'yi eklemeden önce doğrulayın (200 dönmeli):
   `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json`
3. `node scripts/generate-tracks.mjs` çalıştırın — tekrarları ayıklar, kategori başına 50 ile sınırlar, `tracks.ts` dosyasını yeniden yazar.

`startSeconds` (klibin başlama noktası) üretilen kayıtlarda varsayılan 30'dur; belirli bir şarkı için ince ayar gerekiyorsa `tracks.ts` içinde elle düzenlenebilir (çekirdek rap kataloğunun değerleri elle ayarlanmıştır ve script bunları korur).

## Mimari

- Vite + React 18 + TypeScript (strict) + Tailwind CSS v4
- `src/lib/` — saf mantık: Türkçe normalizasyon, arama, deterministik günlük seçim (kategori tuzlu), kalıcılık, kategori bazlı istatistik, paylaşım
- `src/hooks/useYouTubePlayer.ts` — gizli 1×1 YouTube IFrame oynatıcı; klibi tam sınırda durdurur
- `src/components/` — arayüz bileşenleri; `src/data/tracks.ts` — üretilen katalog

Mekanik analizi: `docs/songless-mechanics-analysis.md`
