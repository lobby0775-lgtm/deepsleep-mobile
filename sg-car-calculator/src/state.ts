import { useEffect, useState } from 'react';

/** Reads `?s=` from the hash route (e.g. `#/calculator?s=...`), used by share links. */
function readShared<T>(): Partial<T> | null {
  const q = window.location.hash.split('?')[1];
  if (!q) return null;
  const s = new URLSearchParams(q).get('s');
  if (!s) return null;
  try {
    return JSON.parse(decodeURIComponent(escape(atob(s))));
  } catch {
    return null;
  }
}

/**
 * Page state that survives reloads (localStorage) and can be shared by link.
 * Stored values are merged over `initial` so new fields get their defaults.
 */
export function usePersistentState<T extends object>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    const shared = readShared<T>();
    if (shared) return { ...initial, ...shared };
    try {
      const raw = localStorage.getItem(key);
      if (raw) return { ...initial, ...JSON.parse(raw) };
    } catch {
      /* storage unavailable */
    }
    return initial;
  });

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {
      /* storage unavailable */
    }
  }, [key, value]);

  const set = <K extends keyof T>(k: K, v: T[K]) => setValue((prev) => ({ ...prev, [k]: v }));
  return [value, setValue, set] as const;
}

export function shareUrl(route: string, state: object): string {
  const s = btoa(unescape(encodeURIComponent(JSON.stringify(state))));
  return `${window.location.origin}${window.location.pathname}#/${route}?s=${s}`;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);
