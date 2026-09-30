import { useEffect, useState } from 'react';

/** A share payload, tagged with the page it was made for. */
interface Envelope {
  /** Route segment the payload belongs to, e.g. 'calculator'. */
  r: string;
  /** The page state itself. */
  s: unknown;
}

/** Reads `?s=` from the hash route (e.g. `#/calculator?s=...`), used by share links. */
function readShared<T>(route: string): Partial<T> | null {
  const q = window.location.hash.split('?')[1];
  if (!q) return null;
  const raw = new URLSearchParams(q).get('s');
  if (!raw) return null;
  let env: Envelope;
  try {
    env = JSON.parse(decodeURIComponent(escape(atob(raw))));
  } catch {
    return null;
  }
  // Only apply a payload that was made for this page. Without the tag a link
  // like `#/trade-in?s=<calculator state>` would merge calculator fields into
  // the trade-in form, and the mismatched keys would then be persisted.
  if (!env || typeof env !== 'object' || env.r !== route) return null;
  return (env.s ?? null) as Partial<T> | null;
}

/**
 * Page state that survives reloads (localStorage) and can be shared by link.
 * Stored values are merged over `initial` so new fields get their defaults.
 *
 * `key` is the localStorage slot; `route` is the URL segment this page lives
 * at, and is the value share links are tagged with. They are not always the
 * same string (`calc` vs `calculator`), so both are passed explicitly.
 */
export function usePersistentState<T extends object>(key: string, initial: T, route: string) {
  const [value, setValue] = useState<T>(() => {
    const shared = readShared<T>(route);
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
  const env: Envelope = { r: route, s: state };
  const encoded = btoa(unescape(encodeURIComponent(JSON.stringify(env))));
  return `${window.location.origin}${window.location.pathname}#/${route}?s=${encoded}`;
}

export const todayIso = () => new Date().toISOString().slice(0, 10);
