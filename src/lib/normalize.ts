/**
 * Turkish-aware text normalization for search matching.
 * - Lowercases with Turkish rules (I→ı, İ→i), then folds ı→i so that
 *   "ILGAZ", "ılgaz" and "ilgaz" all match.
 * - Strips all diacritics (ç→c, ş→s, ğ→g, ö→o, ü→u, é→e …) via NFD.
 * - Drops punctuation, collapses whitespace.
 */
export function normalizeTr(input: string): string {
  return input
    .toLocaleLowerCase('tr-TR')
    .replace(/ı/g, 'i')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}
