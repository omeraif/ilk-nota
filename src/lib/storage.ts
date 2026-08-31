/** Tiny localStorage abstraction — all persistence goes through here. */
const PREFIX = 'ilknota:v1:'

export const storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(PREFIX + key)
      return raw === null ? fallback : (JSON.parse(raw) as T)
    } catch {
      return fallback
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value))
    } catch {
      /* storage unavailable (private mode) — game still playable in-memory */
    }
  },
}
