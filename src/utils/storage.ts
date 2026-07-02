/** Thin localStorage wrapper — swallows quota/availability errors (private browsing, etc). */
export const storage = {
  getNumber(key: string, fallback: number): number {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      const parsed = Number(raw);
      return Number.isFinite(parsed) ? parsed : fallback;
    } catch {
      return fallback;
    }
  },

  setNumber(key: string, value: number): void {
    try {
      localStorage.setItem(key, String(value));
    } catch {
      /* ignore write failures */
    }
  },

  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(key);
      if (raw === null) return fallback;
      return JSON.parse(raw) as T;
    } catch {
      return fallback;
    }
  },

  setJSON<T>(key: string, value: T): void {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* ignore write failures */
    }
  },
};
