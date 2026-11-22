/**
 * Save slot for stages 3 onward, kept apart from save.ts so the existing
 * Mercer/Bellweather save format doesn't change.
 * `index` is the position in EXTRA_STAGES; -1 means not reached yet.
 */
const KEY = "car07.extra";
const OLD_YARD_KEY = "car07.yard";

export type ExtraSave = { index: number; bits: number };

export function loadExtra(): ExtraSave {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const data = JSON.parse(raw) as Partial<ExtraSave>;
      const index = Number.isInteger(data.index) ? (data.index as number) : -1;
      return { index, bits: Number(data.bits) | 0 };
    }
    // Saves from the first Yard Nine build.
    const old = localStorage.getItem(OLD_YARD_KEY);
    if (old) {
      const data = JSON.parse(old) as { reached?: boolean; bits?: number };
      if (data.reached) return { index: 0, bits: Number(data.bits) | 0 };
    }
  } catch {
    /* corrupt or blocked storage: start fresh */
  }
  return { index: -1, bits: 0 };
}

export function saveExtra(index: number, bits: number): void {
  try {
    localStorage.setItem(KEY, JSON.stringify({ index, bits }));
    localStorage.removeItem(OLD_YARD_KEY);
  } catch {
    /* storage full or blocked: progress just won't persist */
  }
}

export function clearExtra(): void {
  try {
    localStorage.removeItem(KEY);
    localStorage.removeItem(OLD_YARD_KEY);
  } catch {
    /* ignore */
  }
}
