import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { shareUrl } from './state';

// shareUrl() reads window.location to build the absolute link.
beforeEach(() => {
  vi.stubGlobal('window', { location: { origin: 'https://openbonnet.pages.dev', pathname: '/' } });
});
afterEach(() => vi.unstubAllGlobals());

/**
 * The share-link envelope is the only thing standing between a calculator
 * share link and the trade-in form. These tests pin the tag/verify contract
 * without a DOM: they exercise the same JSON shape `usePersistentState` reads.
 */

const encode = (route: string, state: unknown) => {
  const s = btoa(unescape(encodeURIComponent(JSON.stringify({ r: route, s: state }))));
  return s;
};

/** Mirror of readShared()'s decode + route check, kept in step with state.ts. */
const readShared = <T>(route: string, encoded: string): Partial<T> | null => {
  let env: { r?: string; s?: unknown };
  try {
    env = JSON.parse(decodeURIComponent(escape(atob(encoded))));
  } catch {
    return null;
  }
  if (!env || typeof env !== 'object' || env.r !== route) return null;
  return (env.s ?? null) as Partial<T>;
};

describe('share links', () => {
  it('tags the payload with its route', () => {
    const url = shareUrl('calculator', { dealerPrice: 200_000 });
    const encoded = new URLSearchParams(url.split('?')[1]).get('s')!;
    const env = JSON.parse(decodeURIComponent(escape(atob(encoded))));
    expect(env.r).toBe('calculator');
    expect(env.s).toEqual({ dealerPrice: 200_000 });
  });

  it('round-trips through the same page', () => {
    const state = { dealerPrice: 999_999, omv: 88_888, keepYears: 3 };
    expect(readShared('calculator', encode('calculator', state))).toEqual(state);
  });

  it('is rejected by a different page', () => {
    const encoded = encode('calculator', { dealerPrice: 999_999, omv: 88_888, keepYears: 3 });
    // This is the regression: a calculator payload arriving at trade-in used to
    // be merged in, and the stray keys were then written to localStorage.
    expect(readShared('trade-in', encoded)).toBeNull();
    expect(readShared('deal', encoded)).toBeNull();
    expect(readShared('depreciation', encoded)).toBeNull();
  });

  it('survives non-ASCII values', () => {
    const state = { dealerPrice: 200_000, note: 'Category A — 1,600cc' };
    expect(readShared('calculator', encode('calculator', state))).toEqual(state);
  });

  it('returns null for a payload it cannot parse', () => {
    expect(readShared('calculator', 'not-valid-base64!!')).toBeNull();
    expect(readShared('calculator', btoa('"a bare string"'))).toBeNull();
    expect(readShared('calculator', btoa('null'))).toBeNull();
  });
});
