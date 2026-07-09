import { z } from 'zod';

/**
 * Wire protocol. Every client→server message is parsed with zod before any
 * game code sees it — unknown types, wrong shapes, oversized strings and
 * non-finite numbers are all rejected at the door.
 *
 * The server is authoritative: clients send *intents*, never state.
 */

export const USERNAME_RE = /^[A-Za-z0-9_]{3,16}$/;
export const TICKER_RE = /^[A-Z0-9]{2,8}$/;

const username = z.string().regex(USERNAME_RE);
const token = z.string().regex(/^[a-f0-9]{64}$/);
const finite = (min: number, max: number) => z.number().finite().min(min).max(max);

export const ClientMsg = z.discriminatedUnion('t', [
  z.object({ t: z.literal('register'), username, characterId: z.string().regex(/^[a-z]{2,16}$/) }),
  z.object({ t: z.literal('auth'), token }),
  z.object({ t: z.literal('trade'), kind: z.enum(['buy', 'sell']), coinId: z.string().regex(/^[a-z0-9_-]{1,16}$/), amountUsd: finite(0.01, 1_000_000) }),
  z.object({ t: z.literal('launch'), name: z.string().min(1).max(24), ticker: z.string().min(2).max(8) }),
  z.object({ t: z.literal('chirp'), kind: z.enum(['chirp', 'flex', 'larp']), body: z.string().max(280).optional() }),
  z.object({ t: z.literal('buy_item'), itemId: z.string().regex(/^[a-z0-9_-]{2,24}$/) }),
  z.object({ t: z.literal('gamble'), pick: z.enum(['heads', 'tails']), amountUsd: finite(0.01, 1_000_000) }),
  z.object({ t: z.literal('unregister') }),
  z.object({ t: z.literal('ping') }),
]);
export type ClientMsg = z.infer<typeof ClientMsg>;

// ── server → client ─────────────────────────────────────────────────

export interface WireCoin {
  id: string; name: string; ticker: string;
  price: number; change: number; mcap: string;
  up: boolean; rug?: boolean; badge?: 'HOT' | 'RUG';
  hist: number[];
  creator?: string; // username of the degen who launched it
}

export interface WireChirp {
  id: number; name: string; handle: string; body: string;
  verified: boolean; larp?: boolean; likes: number; reposts: number;
  followers: number; at: number;
}

export interface WireProfile {
  username: string; handle: string; characterId: string;
  balance: number; clout: number; followers: number; blueCheck: boolean;
  owned: string[]; holdings: Record<string, number>;
}

export type ServerMsg =
  | { t: 'registered'; token: string; profile: WireProfile }
  | { t: 'auth_ok'; profile: WireProfile; coins: WireCoin[]; chirps: WireChirp[]; online: number }
  | { t: 'error'; code: string; msg: string }
  | { t: 'tick'; prices: { id: string; price: number; change: number }[] }
  | { t: 'coin_launched'; coin: WireCoin; by: string }
  | { t: 'trade'; coinId: string; price: number; change: number; side: 'buy' | 'sell'; usd: number; by: string }
  | { t: 'chirp'; post: WireChirp }
  | { t: 'wallet'; balance: number; clout: number; followers: number; blueCheck: boolean; owned: string[]; holdings: Record<string, number> }
  | { t: 'gamble_result'; side: 'heads' | 'tails'; won: boolean; delta: number; balance: number }
  | { t: 'notice'; kind: 'good' | 'bad' | 'info'; msg: string }
  | { t: 'online'; count: number }
  | { t: 'pong' };
