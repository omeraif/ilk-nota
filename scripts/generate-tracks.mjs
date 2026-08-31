// .catalogue/*.json (workflow ajanlarının doğruladığı listeler) + elle ayarlanmış
// çekirdek rap kataloğunu birleştirip src/data/tracks.ts üretir.
// Kullanım: node scripts/generate-tracks.mjs
import { readFileSync, readdirSync, writeFileSync, existsSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const CAT_DIR = join(root, '.catalogue')
const OUT = join(root, 'src/data/tracks.ts')
const TARGET = 50

const GENRE_ORDER = ['rap', 'pop', 'rock', 'arabesk', 'doksanlar', 'ikibinler', 'turku', 'sanat', 'slow', 'indie']

// Elle ayarlanmış startSeconds değerleriyle çekirdek rap kataloğu (v1'den, oEmbed doğrulamalı)
const CORE_RAP = [
  { title: 'Suspus', artist: 'Ceza', featuring: [], aliases: [], year: 2015, videoId: 'mY--4-vzY6E', startSeconds: 60 },
  { title: '366. Gün', artist: 'Sagopa Kajmer', featuring: [], aliases: ['sago', '366 gun', '366gün'], year: 2016, videoId: 'PUiNB0UFwJM', startSeconds: 45 },
  { title: 'Mekanın Sahibi', artist: 'Norm Ender', featuring: [], aliases: ['mekanin sahibi geldi'], year: 2019, videoId: 'z3wAjJXbYzA', startSeconds: 30 },
  { title: 'Geceler', artist: 'Ezhel', featuring: [], aliases: ['ezel'], year: 2017, videoId: 'XokJGO8ALVs', startSeconds: 55 },
  { title: 'Kalbim Çukurda', artist: 'Gazapizm', featuring: ['Cem Adrian'], aliases: ['cukur', 'çukur'], year: 2017, videoId: '_Iq_uEZuqGg', startSeconds: 35 },
  { title: 'Susamam', artist: 'Şanışer', featuring: ['Fuat', 'Ados', 'Hayki', 'Server Uraz', 'Sokrat St', 'Ozbi'], aliases: ['#susamam', 'saniser'], year: 2019, videoId: 'L5K3IxINr7A', startSeconds: 25 },
  { title: 'Hadi Yaparsın', artist: 'Şehinşah', featuring: [], aliases: ['haydi yaparsin', 'sehinsah'], year: 2018, videoId: 'MxSivZW8LNM', startSeconds: 30 },
  { title: 'Demet Akalın', artist: 'Ben Fero', featuring: [], aliases: ['benfero', 'para para para'], year: 2019, videoId: 'fdg2OG8zFiM', startSeconds: 42 },
  { title: 'Krvn', artist: 'Uzi', featuring: [], aliases: ['kervan', 'karavan', 'kravan'], year: 2020, videoId: 'g6hps3aDJhI', startSeconds: 20 },
  { title: 'PVG', artist: 'Motive', featuring: [], aliases: [], year: 2022, videoId: '55_a15rbHAk', startSeconds: 25 },
  { title: 'DACIA', artist: 'Lvbel C5', featuring: [], aliases: ['lvbelc5', 'label c5', 'c5', 'daçya'], year: 2023, videoId: 'ZqZGerGc1Ho', startSeconds: 35 },
  { title: 'Dalga', artist: 'Batuflex', featuring: [], aliases: ['batu flex', 'dalga dalga'], year: 2023, videoId: '48HSS_XnEvM', startSeconds: 30 },
  { title: 'Bilmem Mi?', artist: 'Sefo', featuring: [], aliases: ['bilmemmi'], year: 2020, videoId: 'eFutYdmi2gc', startSeconds: 15 },
  { title: 'Yak', artist: 'Tepki', featuring: ['Ceza'], aliases: [], year: 2020, videoId: '4ZCa-WPqgFk', startSeconds: 30 },
  { title: 'Bi Sonraki Hayatımda Gel', artist: 'Murda', featuring: ['Ezhel'], aliases: ["bi' sonraki hayatimda gel", 'bir sonraki hayatimda gel'], year: 2019, videoId: 'tiEt1qkaaGA', startSeconds: 30 },
]

const trMap = { ç: 'c', ğ: 'g', ı: 'i', ö: 'o', ş: 's', ü: 'u' }
const slug = (s) =>
  s
    .toLocaleLowerCase('tr-TR')
    .replace(/[çğıöşü]/g, (c) => trMap[c])
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
const normKey = (t) => slug(`${t.artist} ${t.title}`)

const seenVideo = new Set()
const seenSong = new Set()
const seenId = new Set()
const byGenre = {}
const report = []

function push(genre, raw, startSeconds) {
  if (!raw.videoId || !raw.title || !raw.artist || !/^[\w-]{11}$/.test(raw.videoId)) return false
  const song = normKey(raw)
  if (seenVideo.has(raw.videoId) || seenSong.has(song)) return false
  let id = slug(`${raw.artist}-${raw.title}`) || `track-${seenId.size}`
  while (seenId.has(id)) id += '-2'
  seenVideo.add(raw.videoId)
  seenSong.add(song)
  seenId.add(id)
  ;(byGenre[genre] ??= []).push({
    id,
    title: String(raw.title).trim(),
    artist: String(raw.artist).trim(),
    featuring: Array.isArray(raw.featuring) ? raw.featuring.map(String) : [],
    aliases: Array.isArray(raw.aliases) ? raw.aliases.map(String) : [],
    genre,
    year: Number.isInteger(raw.year) ? raw.year : 2000,
    youtubeId: raw.videoId,
    thumbnail: `https://i.ytimg.com/vi/${raw.videoId}/hqdefault.jpg`,
    startSeconds,
  })
  return true
}

for (const t of CORE_RAP) push('rap', t, t.startSeconds)

for (const genre of GENRE_ORDER) {
  const file = join(CAT_DIR, `${genre}.json`)
  if (!existsSync(file)) {
    report.push(`${genre}: DOSYA YOK`)
    continue
  }
  let list
  try {
    list = JSON.parse(readFileSync(file, 'utf8'))
  } catch (e) {
    report.push(`${genre}: JSON HATASI ${e.message}`)
    continue
  }
  for (const raw of list) {
    if ((byGenre[genre]?.length ?? 0) >= TARGET) break
    push(genre, raw, 30)
  }
  report.push(`${genre}: ${byGenre[genre]?.length ?? 0}/${TARGET}`)
}

const all = GENRE_ORDER.flatMap((g) => byGenre[g] ?? [])
const lines = all.map((t) => `  ${JSON.stringify(t)},`)
const out = `import type { Track } from '../types'

/**
 * İlk Nota şarkı kataloğu — 10 kategori, kategori başına ${TARGET} şarkı hedefi.
 * BU DOSYA scripts/generate-tracks.mjs TARAFINDAN ÜRETİLİR — elle şarkı
 * eklemek için .catalogue/<kategori>.json dosyasına kayıt ekleyip scripti
 * yeniden çalıştırın. Her videoId oEmbed ile doğrulanmıştır (bkz. README).
 */
export const TRACKS: Track[] = [
${lines.join('\n')}
]
`
writeFileSync(OUT, out)
console.log(report.join('\n'))
console.log(`TOPLAM: ${all.length}`)
