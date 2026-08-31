# BUILD_NOTES — İlk Nota

## v3 — 10 kategori × 50 şarkı + canlı yayın (2026-08-31)

- **Katalog**: 10 kategori (Rap, Pop, Rock, Arabesk, 90'lar, 2000'ler, Türkü, Sanat Müziği, Slow, İndie) × tam 50 şarkı = **500 doğrulanmış kayıt**. 10 paralel ajanlık workflow her videoId'yi oEmbed ile doğruladı (557 aday → dedupe → 500); ben ayrıca 27 rastgele örneği bağımsız doğruladım (27/27). Kaynak: `.catalogue/*.json`, üretici: `scripts/generate-tracks.mjs` → `src/data/tracks.ts`.
- **Kategori sistemi**: yatay çip barı; her kategorinin kendi günlük şarkısı (tarih+kategori tuzlu hash), kendi sınırsız destesi ve kendi istatistikleri (`daily:<tarih>:<kategori>`, `free:session:<kategori>`, `stats:<kategori>`). Arama aktif kategoriyle sınırlı.
- **UI**: Bricolage Grotesque + Hanken Grotesk (overused-font bulgusuna istinaden), OG/Twitter kart meta'ları + matplotlib ile üretilmiş `public/og.png` link önizlemesi, paylaşım metnine site linki eklendi.
- **Yayın**: GitHub Pages — https://omeraif.github.io/ilk-nota/ (repo: github.com/omeraif/ilk-nota, `scripts/deploy.sh` dist'i `gh-pages` dalına iter; SPA için 404.html kopyası). Vite `base: /ilk-nota/` yalnızca build'de.
- **Test**: typecheck + build temiz; tarayıcıda 10 çipin görünürlüğü, kategori geçişi, kategoriye özel arama (Arabesk'te "müslüm" 4 sonuç, "ceza" 0 sonuç), Türkü'de pas → satır + 0,5s ilerleme, oynatıcı hatasız; mobil ekran görüntüsü incelendi.
- Not: `startSeconds` yeni 485 kayıtta varsayılan 30 sn (şarkının tanınabilir kısmına denk gelecek güvenli nokta); çekirdek 15 rap parçasının elle ayarlı değerleri korunuyor.


## What was built

A faithful Turkish rap adaptation of Songless's complete game loop, as a Vite + React 18 + TypeScript (strict) + Tailwind v4 SPA at **`~/ilk-nota`** (route: `/`, single page).

### Reference research (live, browser-automated)

Played lessgames.com/songless via Playwright before writing code; every rule documented in `docs/songless-mechanics-analysis.md`. Key measured facts reproduced 1:1:

- 6 attempts, snippet unlock sequence **0.1 → 0.5 → 2 → 4 → 8 → 15 s**
- wrong guess and skip both advance; final-stage button becomes "Give up" (→ "Pes Et")
- two-step answer flow: pick suggestion → button morphs to Submit ("Tahmin Et")
- attempts render as rows (skip / wrong-guess label); suggestions are "Title - Artist" matched on title *and* artist substrings
- game-over reveal + stats (distribution 1–6/X) + countdown + share squares (⬜ skip, 🟥 wrong, 🟩 correct) — captured Songless's real clipboard text as the template
- Songless itself plays audio via a hidden 1×1 embedded iframe (SoundCloud); İlk Nota uses the same technique with the YouTube IFrame API

### Features

- **Günün Şarkısı**: one deterministic track per local calendar day (hash of date → catalogue index), same after refresh; puzzle number "Gün #N" from launch date 2026-08-29.
- **Sınırsız Oyna** (added on request): tab next to the daily mode. Shuffle-bag queue over the 15-track catalogue (no repeats until exhausted, then reshuffle avoiding back-to-back repeat); identical stage/guess/reveal mechanics; result shows "Sonraki Şarkı" which immediately loads the next track; only the active session (queue + position + current game) persists in `localStorage` (`ilknota:v1:free:session`) so refresh keeps the active song. Daily state and stats are untouched by free play. Verified in-browser: enter mode, refresh stability, win → next, give-up → next, three distinct songs back-to-back, daily tab unaffected; typecheck + build clean.
- **Catalogue**: 15 verified tracks in `src/data/tracks.ts` (Ceza, Sagopa Kajmer, Norm Ender, Ezhel, Gazapizm, Şanışer, Şehinşah, Ben Fero, Uzi, Motive, Lvbel C5, Batuflex, Sefo, Tepki, Murda). Every YouTube ID verified via oEmbed (200 + title match, embeddable) by a 3-agent verification workflow on 2026-08-29. Each record: id, title, artist, featuring, aliases, genre, year, youtubeId, thumbnail, startSeconds (intro offset — estimated to land inside the recognizable section; tune per track by ear).
- **Turkish search**: `normalizeTr` (tr-TR lowercasing, ı/i folding, NFD diacritic strip, punctuation-insensitive); matches title-only, artist-only, "artist title", "title artist", featuring names, aliases; suggestions show thumbnail + title + artist; only a selected suggestion can be submitted.
- **Audio**: hidden 1×1 YT player, plays from `startSeconds` for exactly the unlocked duration (25 ms poll + watchdog), replay of current clip, no overlapping audio, mute + volume, soft error card with retry (guessing/skipping stays available — completion is never blocked). After resolution a visible embed reveals the song.
- **States**: first-play help modal, playing, wrong (shake + row), correct, reveal/lost, finished-daily lock (refresh-proof), share (native share → clipboard fallback + toast), player error.
- **Persistence**: `localStorage` behind `src/lib/storage.ts` (`ilknota:v1:*`) — per-day state, stats (played/wins/streak/max/distribution), help-seen flag.
- **A11y/keyboard**: full ARIA combobox (arrows/Enter/Escape), Space = play/stop when not in a field, Escape closes dialogs, aria-live announcements, reduced-motion support, focus-visible rings.
- **Answer secrecy**: no track title/artist in text, DOM labels, console, or accessible names before resolution; the hidden iframe's YouTube-set title is overwritten ("Ses çalar") and aria-hidden. Caveat (inherent to embeds, identical in Songless): the video ID appears in the iframe `src`, and the persisted daily state contains the trackId — inspectable via devtools, not via UI.

## Commands run (all green)

- `npx tsc -b --force` — 0 errors (strict)
- `npm run build` (tsc -b && vite build) — clean, 171 kB JS / 24 kB CSS
- No linter is configured in this repo's sibling projects; typecheck serves as the static gate.

## Browser tests (Playwright, dev server :5199)

Desktop 1280×800 + mobile 390×844, screenshots inspected at both widths:
first play ✓ · auto-stop at 2 s boundary ✓ · replay + manual stop ✓ · wrong answer (row + 0,1→0,5 unlock + shake) ✓ · skip (row + unlock) ✓ · Turkish search (SUSPUS uppercase, BİLMEM Mİ dotted-İ, ş/ascii "şanışer/saniser", aliases "ezel"→Geceler, "kervan"→Krvn, feat "ceza yak", "tepki - yak") ✓ · keyboard staging (ArrowDown+Enter, Enter submits) ✓ · win state + stats recorded ✓ · share → clipboard + toast ✓ · mid-game refresh persistence ✓ · completed-daily lock on refresh ✓ · Space play/stop ✓ · Escape closes list ✓ · reveal embed loads ✓. Only console noise: YouTube's own permissions-policy notices.

YouTube-failure fallback implemented (error card + retry + guessing continues); exercised by code review rather than a forced network fault.

## Locations

- Route: `/` (single page). Catalogue: `src/data/tracks.ts`. Mechanics doc: `docs/songless-mechanics-analysis.md`.
- Run: `npm install && npm run dev`.
