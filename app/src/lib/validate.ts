import type { Coin, Txn, Character } from '../os/types';

/**
 * Strict validators/sanitizers for anything that crosses a trust boundary:
 * - data rehydrated from localStorage (user-editable)
 * - messages received over BroadcastChannel (any same-origin tab can forge them)
 *
 * Policy: allowlist everything. Anything that doesn't match the expected
 * shape is rejected (returns null) rather than "fixed up", so corrupted or
 * tampered payloads can never crash the app or smuggle in weird values.
 */

export const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;
export const TICKER_RE = /^[A-Z0-9]{2,8}$/;
export const COIN_ID_RE = /^[a-z0-9_-]{1,16}$/;

const WALLPAPERS = ['sonoma', 'blueprint', 'code', 'helloworld'] as const;
export type WallpaperId = (typeof WALLPAPERS)[number];

export function isUsername(v: unknown): v is string {
  return typeof v === 'string' && USERNAME_RE.test(v);
}

export function finiteNum(v: unknown, min: number, max: number): number | null {
  if (typeof v !== 'number' || !Number.isFinite(v)) return null;
  if (v < min || v > max) return null;
  return v;
}

/** Plain string, control chars stripped, hard length cap. */
export function safeStr(v: unknown, maxLen: number): string | null {
  if (typeof v !== 'string') return null;
  // eslint-disable-next-line no-control-regex
  const cleaned = v.replace(/[\u0000-\u001F\u007F]/g, '').trim();
  if (cleaned.length === 0 || cleaned.length > maxLen) return null;
  return cleaned;
}

export function sanitizeWallpaper(v: unknown): WallpaperId | null {
  return WALLPAPERS.includes(v as WallpaperId) ? (v as WallpaperId) : null;
}

/** Rebuild a coin from untrusted input. Rejects instead of guessing. */
export function sanitizeCoin(v: unknown): Coin | null {
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return null;
  const o = v as Record<string, unknown>;
  const id = typeof o.id === 'string' && COIN_ID_RE.test(o.id) ? o.id : null;
  const ticker = typeof o.ticker === 'string' && TICKER_RE.test(o.ticker) ? o.ticker : null;
  const name = safeStr(o.name, 32);
  const price = finiteNum(o.price, 0, 1e12);
  const change = finiteNum(o.change, -100, 1e6);
  const mcap = safeStr(o.mcap, 12);
  if (!id || !ticker || !name || price === null || change === null || !mcap) return null;

  if (!Array.isArray(o.hist) || o.hist.length < 2 || o.hist.length > 60) return null;
  const histArr: number[] = [];
  for (const h of o.hist) {
    const n = finiteNum(h, 0, 1e12);
    if (n === null) return null;
    histArr.push(n);
  }

  const badge = o.badge === 'HOT' || o.badge === 'RUG' ? o.badge : undefined;
  // Rebuild as a fresh plain object — never spread untrusted objects into state.
  return {
    id, name, ticker, price, change, mcap,
    up: o.up === true,
    rug: o.rug === true || undefined,
    badge,
    hist: histArr,
  };
}

export function sanitizeCoins(v: unknown, maxCoins = 60): Coin[] | null {
  if (!Array.isArray(v) || v.length > maxCoins) return null;
  const out: Coin[] = [];
  const seen = new Set<string>();
  for (const c of v) {
    const coin = sanitizeCoin(c);
    if (!coin || seen.has(coin.id)) return null;
    seen.add(coin.id);
    out.push(coin);
  }
  return out.length > 0 ? out : null;
}

export function sanitizeTxns(v: unknown): Txn[] {
  if (!Array.isArray(v)) return [];
  const out: Txn[] = [];
  for (const t of v.slice(0, 40)) {
    if (typeof t !== 'object' || t === null) continue;
    const o = t as Record<string, unknown>;
    const label = safeStr(o.label, 80);
    const delta = finiteNum(o.delta, -1e12, 1e12);
    const time = finiteNum(o.t, 0, 8.64e15);
    const id = finiteNum(o.id, 0, Number.MAX_SAFE_INTEGER);
    if (!label || delta === null || time === null || id === null) continue;
    out.push({ id, label, delta, kind: delta >= 0 ? 'in' : 'out', t: time });
  }
  return out;
}

/** Record<string, number> with allowlisted keys and finite non-negative values. */
export function sanitizeHoldings(v: unknown): Record<string, number> {
  const out: Record<string, number> = {};
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return out;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (!COIN_ID_RE.test(k)) continue;
    const n = finiteNum(val, 0, 1e15);
    if (n === null) continue;
    out[k] = n;
  }
  return out;
}

/** Record<string, boolean> restricted to known shop item ids. */
export function sanitizeOwned(v: unknown, validIds: string[]): Record<string, boolean> {
  const out: Record<string, boolean> = {};
  if (typeof v !== 'object' || v === null || Array.isArray(v)) return out;
  for (const id of validIds) {
    if ((v as Record<string, unknown>)[id] === true) out[id] = true;
  }
  return out;
}

/**
 * Resolve a persisted character against the canonical roster.
 * We only trust the id — name/bag/desc are always taken from the canonical
 * definition so a tampered save can't change the starting bag.
 */
export function resolveCharacter(v: unknown, roster: Character[]): Character | null {
  if (typeof v !== 'object' || v === null) return null;
  const id = (v as Record<string, unknown>).id;
  if (typeof id !== 'string') return null;
  return roster.find((c) => c.id === id) ?? null;
}
