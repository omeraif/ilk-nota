# İlk Nota 🎧

Günün Türkçe rap şarkısını ilk notalarından tahmin et. Songless'ın oyun mekaniğinin Türkçe rap/hip-hop için sadık bir uyarlaması — özgün marka, özgün arayüz.

## Oynanış

- Her gün (yerel gece yarısında yenilenen) tek bir deterministik şarkı.
- 6 hak; açılan bölüm süreleri: **0,1 → 0,5 → 2 → 4 → 8 → 15 saniye** (Songless ile birebir).
- Yanlış tahmin de pas da bir sonraki süreyi açar. Son hakta "Pas Geç" yerine "Pes Et" görünür.
- Öneriden seç → "Tahmin Et" ile onayla. Serbest metin asla tahmin sayılmaz.
- Sonuç: kutlama/reveal, istatistikler, seri, tahmin dağılımı, geri sayım ve emoji paylaşımı (⬜ pas, 🟥 yanlış, 🟩 doğru).
- **Sınırsız Oyna**: aynı mekaniklerle arka arkaya rastgele şarkı. Karıştırılmış 15'lik "deste" bitmeden şarkı tekrar etmez; deste bitince yeniden karılır. Sonuçta "Sonraki Şarkı" ile hemen devam edilir; aktif oturum `localStorage`'da tutulur, yenilemede şarkı değişmez. Günlük mod ve istatistikleri etkilenmez.

## Çalıştırma

```bash
npm install
npm run dev        # http://localhost:5173
npm run typecheck  # tsc -b
npm run build      # üretim derlemesi -> dist/
npm run preview    # dist/ önizleme
```

Dağıtım: `dist/` klasörü statiktir — Vercel/Netlify/GitHub Pages dahil her statik hosta yüklenebilir. Sunucu, hesap ya da veritabanı yoktur; tüm ilerleme `localStorage`'da tutulur.

## Şarkı ekleme

Tüm katalog tek dosyada: **`src/data/tracks.ts`**.

1. Şarkının resmi YouTube videosunun kimliğini bulun.
2. Gömülebilirliği doğrulayın (200 dönmeli):
   `https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=<ID>&format=json`
3. Listeye yeni bir kayıt ekleyin: `id`, `title`, `artist`, `featuring`, `aliases`, `year`, `youtubeId`, `thumbnail` (yardımcı `thumb()` ile), `startSeconds` (intro'yu atlayıp tanınabilir kısma denk gelen saniye).

Günün şarkısı tarihe göre deterministik seçildiğinden, listeye ekleme yapmak geçmiş günleri etkilemez ama o günün seçimini değiştirebilir — katalog değişikliklerini gün ortasında değil, günlük döngü sonrasında yayınlamak en temizidir.

## Mimari

- Vite + React 18 + TypeScript (strict) + Tailwind CSS v4
- `src/lib/` — saf mantık: Türkçe normalizasyon (`normalize.ts`), arama (`search.ts`), deterministik günlük seçim (`daily.ts`), kalıcılık (`storage.ts`), istatistik (`stats.ts`), paylaşım (`share.ts`)
- `src/hooks/useYouTubePlayer.ts` — gizli 1×1 YouTube IFrame oynatıcı; klibi tam sınırda durdurur, hataları yumuşak karşılar
- `src/components/` — arayüz bileşenleri; `src/data/tracks.ts` — katalog

Mekanik analizi: `docs/songless-mechanics-analysis.md`
