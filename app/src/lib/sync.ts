import type { Coin, Txn } from '../os/types';
import {
  sanitizeCoin, sanitizeCoins, sanitizeTxns, sanitizeHoldings,
  finiteNum, safeStr, isUsername,
} from './validate';

/**
 * Cross-tab realtime sync over BroadcastChannel.
 *
 * Security notes:
 * - BroadcastChannel is same-origin only: no external website can inject
 *   messages here. The remaining "attacker" is the player's own devtools —
 *   every incoming payload is still fully re-validated before it touches
 *   state, so a forged or corrupted message can never crash the app or
 *   smuggle malformed data into the store.
 * - Integrity hashes are NEVER transmitted. Receivers recompute them locally
 *   from the shared salt, so a forged message can't grief another tab into
 *   the cheater screen and can't bypass the checksum system.
 * - Messages carry a random per-tab id; a tab ignores its own messages and
 *   appliers never re-broadcast, so no feedback loops.
 * - Incoming traffic is rate-limited so a hostile tab can't spam-freeze the UI.
 * - Leader election: exactly one tab advances the market + miner income and
 *   broadcasts MARKET_TICK. Keeps prices identical across tabs and blocks
 *   the "open N tabs for N× miner income" exploit.
 */

const CHANNEL = 'trenchos_sync';
const MAX_MSGS_PER_SEC = 40;
const SHOP_ID_RE = /^[a-z0-9_-]{2,24}$/;

function randId(): string {
  try {
    const b = new Uint8Array(8);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Date.now().toString(36);
  }
}

export const TAB_ID = randId();

export interface RemoteChirp {
  name: string;
  handle: string;
  body: string;
  followers: string;
  verified: boolean;
}

export type SyncMsg =
  | { type: 'CHIRP_POSTED'; post: RemoteChirp; clout: number; followers: number }
  | { type: 'COIN_LAUNCHED'; coin: Coin; balance: number; txns: Txn[] }
  | { type: 'TRADE_EXECUTED'; coin: Coin; balance: number; holdings: Record<string, number>; txns: Txn[] }
  | { type: 'WALLET_SYNC'; balance: number; clout: number; followers: number; blueCheck: boolean; ownedIds: string[]; txns: Txn[] }
  | { type: 'MARKET_TICK'; coins: Coin[]; balance?: number }
  | { type: 'PROFILE_UPDATED'; username: string; handle: string; chosenId: string }
  | { type: 'HELLO' };

type Envelope = { tab: string; msg: SyncMsg };

let channel: BroadcastChannel | null = null;
try {
  channel = typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel(CHANNEL) : null;
} catch {
  channel = null;
}

export const syncSupported = channel !== null;

export function publish(msg: SyncMsg): void {
  try { channel?.postMessage({ tab: TAB_ID, msg } as Envelope); } catch { /* channel closed / clone error — drop */ }
}

/* ── strict validation of incoming messages ─────────────────────────── */

function validateMsg(raw: unknown): SyncMsg | null {
  if (typeof raw !== 'object' || raw === null) return null;
  const m = raw as Record<string, unknown>;
  switch (m.type) {
    case 'HELLO':
      return { type: 'HELLO' };
    case 'PROFILE_UPDATED': {
      if (!isUsername(m.username) || !isUsername(m.handle)) return null;
      if (typeof m.chosenId !== 'string' || !/^[a-z0-9_-]{1,16}$/.test(m.chosenId)) return null;
      return { type: 'PROFILE_UPDATED', username: m.username as string, handle: (m.handle as string).toLowerCase(), chosenId: m.chosenId };
    }
    case 'CHIRP_POSTED': {
      const p = m.post as Record<string, unknown> | undefined;
      if (!p || typeof p !== 'object') return null;
      const name = safeStr(p.name, 24);
      const handle = isUsername(p.handle) ? (p.handle as string) : null;
      const body = safeStr(p.body, 280);
      const followers = safeStr(p.followers, 10);
      const clout = finiteNum(m.clout, -1e9, 1e9);
      const fol = finiteNum(m.followers, 0, 1e12);
      if (!name || !handle || !body || !followers || clout === null || fol === null) return null;
      return {
        type: 'CHIRP_POSTED',
        post: { name, handle, body, followers, verified: p.verified === true },
        clout, followers: fol,
      };
    }
    case 'COIN_LAUNCHED': {
      const coin = sanitizeCoin(m.coin);
      const balance = finiteNum(m.balance, 0, 1e15);
      if (!coin || balance === null) return null;
      return { type: 'COIN_LAUNCHED', coin, balance, txns: sanitizeTxns(m.txns) };
    }
    case 'TRADE_EXECUTED': {
      const coin = sanitizeCoin(m.coin);
      const balance = finiteNum(m.balance, 0, 1e15);
      if (!coin || balance === null) return null;
      return {
        type: 'TRADE_EXECUTED', coin, balance,
        holdings: sanitizeHoldings(m.holdings), txns: sanitizeTxns(m.txns),
      };
    }
    case 'WALLET_SYNC': {
      const balance = finiteNum(m.balance, 0, 1e15);
      const clout = finiteNum(m.clout, -1e9, 1e9);
      const followers = finiteNum(m.followers, 0, 1e12);
      if (balance === null || clout === null || followers === null) return null;
      const ownedIds = Array.isArray(m.ownedIds)
        ? (m.ownedIds as unknown[]).filter((x): x is string => typeof x === 'string' && SHOP_ID_RE.test(x)).slice(0, 32)
        : [];
      return {
        type: 'WALLET_SYNC', balance, clout, followers,
        blueCheck: m.blueCheck === true, ownedIds, txns: sanitizeTxns(m.txns),
      };
    }
    case 'MARKET_TICK': {
      const coins = sanitizeCoins(m.coins);
      if (!coins) return null;
      const out: Extract<SyncMsg, { type: 'MARKET_TICK' }> = { type: 'MARKET_TICK', coins };
      if (m.balance !== undefined) {
        const balance = finiteNum(m.balance, 0, 1e15);
        if (balance === null) return null;
        out.balance = balance;
      }
      return out;
    }
    default:
      return null;
  }
}

/* ── subscription with rate limiting ─────────────────────────────────── */

type Handler = (msg: SyncMsg, fromTab: string) => void;
const handlers = new Set<Handler>();

let windowStart = Date.now();
let windowCount = 0;

if (channel) {
  channel.onmessage = (ev: MessageEvent) => {
    const now = Date.now();
    if (now - windowStart > 1000) { windowStart = now; windowCount = 0; }
    if (++windowCount > MAX_MSGS_PER_SEC) return; // drop floods

    const env = ev.data as Envelope | undefined;
    if (typeof env !== 'object' || env === null) return;
    if (typeof env.tab !== 'string' || env.tab === TAB_ID) return; // ignore self
    const msg = validateMsg(env.msg);
    if (!msg) return;
    seePeer(env.tab);
    handlers.forEach((h) => { try { h(msg, env.tab); } catch { /* one bad handler must not kill the bus */ } });
  };
}

export function subscribe(h: Handler): () => void {
  handlers.add(h);
  return () => handlers.delete(h);
}

/* ── leader election ─────────────────────────────────────────────────── */
// Every received message doubles as a heartbeat. The tab with the lowest id
// among recently-seen peers (including itself) is the leader. A single tab
// is always its own leader; if the leader closes, another takes over within
// PEER_TTL milliseconds.

const PEER_TTL = 4500;
const peers = new Map<string, number>(); // tabId -> last seen

function seePeer(tab: string) {
  if (peers.size < 32 || peers.has(tab)) peers.set(tab, Date.now());
}

export function isLeader(): boolean {
  const now = Date.now();
  for (const [tab, seen] of peers) {
    if (now - seen > PEER_TTL) { peers.delete(tab); continue; }
    if (tab < TAB_ID) return false;
  }
  return true;
}

// Announce ourselves so existing tabs learn about us quickly, and keep a
// slow heartbeat so leadership stays fresh even when nothing is happening.
if (channel) {
  publish({ type: 'HELLO' });
  window.setInterval(() => publish({ type: 'HELLO' }), 2000);
}
