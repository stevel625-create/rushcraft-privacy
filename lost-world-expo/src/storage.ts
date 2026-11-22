import AsyncStorage from '@react-native-async-storage/async-storage';
import type { SaveData } from './engine/game';

/**
 * Local persistence. Every call is wrapped so storage problems never crash the game:
 * reads fall back to defaults and writes report success as a boolean.
 */
const SAVE_KEY = 'lostworld.save.v1';
const UNLOCK_KEY = 'lostworld.unlocked';
const MOCK_PREFIX = 'lostworld.mockiap.';

export async function readSave(): Promise<SaveData | null> {
  try {
    const raw = await AsyncStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const d = JSON.parse(raw) as SaveData;
    return d && d.version === 1 && Array.isArray(d.position) ? d : null;
  } catch {
    return null;
  }
}

export async function writeSave(d: SaveData): Promise<boolean> {
  try {
    await AsyncStorage.setItem(SAVE_KEY, JSON.stringify(d));
    return true;
  } catch {
    return false;
  }
}

export async function deleteSave() {
  try { await AsyncStorage.removeItem(SAVE_KEY); } catch { /* ignore */ }
}

/** Number of unlocked levels (always at least 1). */
export async function readUnlocked(): Promise<number> {
  try {
    return Math.max(1, Number(await AsyncStorage.getItem(UNLOCK_KEY)) || 1);
  } catch {
    return 1;
  }
}

export async function unlockThrough(index: number): Promise<number> {
  const current = await readUnlocked();
  const next = Math.max(current, index + 1);
  try { await AsyncStorage.setItem(UNLOCK_KEY, String(next)); } catch { /* ignore */ }
  return next;
}

export async function resetUnlocks() {
  try { await AsyncStorage.removeItem(UNLOCK_KEY); } catch { /* ignore */ }
}

export async function readMockOwned(ids: string[]): Promise<Set<string>> {
  const owned = new Set<string>();
  try {
    for (const id of ids) if ((await AsyncStorage.getItem(MOCK_PREFIX + id)) === '1') owned.add(id);
  } catch { /* ignore */ }
  return owned;
}

export async function setMockOwned(id: string) {
  try { await AsyncStorage.setItem(MOCK_PREFIX + id, '1'); } catch { /* ignore */ }
}

export async function resetMockOwned(ids: string[]) {
  try { await AsyncStorage.multiRemove(ids.map((id) => MOCK_PREFIX + id)); } catch { /* ignore */ }
}
