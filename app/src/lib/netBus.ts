/**
 * Tiny indirection layer between the store and the network client, so
 * store/os.ts never imports lib/net.ts (no circular imports). net.ts
 * registers itself here; the store and components only talk to the bus.
 */

export type NetAction =
  | { t: 'register'; username: string; characterId: string }
  | { t: 'auth'; token: string }
  | { t: 'trade'; kind: 'buy' | 'sell'; coinId: string; amountUsd: number }
  | { t: 'launch'; name: string; ticker: string }
  | { t: 'chirp'; kind: 'chirp' | 'flex' | 'larp'; body?: string }
  | { t: 'buy_item'; itemId: string }
  | { t: 'gamble'; pick: 'heads' | 'tails'; amountUsd: number }
  | { t: 'unregister' }
  | { t: 'admin_auth'; token: string }
  | { t: 'delete_coin'; ticker: string }
  | { t: 'ping' };

export interface NetChirp {
  id: number; name: string; handle: string; body: string;
  verified: boolean; larp?: boolean; likes: number; reposts: number;
  followers: number; at: number;
}

let sender: ((a: NetAction) => void) | null = null;
export function setNetSender(fn: ((a: NetAction) => void) | null): void { sender = fn; }

/** Send an action to the server. Returns false when not connected. */
export function netSend(a: NetAction): boolean {
  if (!sender) return false;
  sender(a);
  return true;
}

/* ── chirp feed events (Chirper subscribes; net.ts publishes) ──────── */

type ChirpListener = (post: NetChirp) => void;
const chirpListeners = new Set<ChirpListener>();
const chirpBuffer: NetChirp[] = []; // newest first, so a freshly opened Chirper sees history

export function pushNetChirp(post: NetChirp): void {
  chirpBuffer.unshift(post);
  chirpBuffer.length = Math.min(chirpBuffer.length, 50);
  chirpListeners.forEach((l) => { try { l(post); } catch { /* listener must not kill the bus */ } });
}

export function seedNetChirps(posts: NetChirp[]): void {
  chirpBuffer.length = 0;
  chirpBuffer.push(...posts.slice(0, 50));
}

export function getNetChirps(): NetChirp[] { return [...chirpBuffer]; }

export function onNetChirp(l: ChirpListener): () => void {
  chirpListeners.add(l);
  return () => chirpListeners.delete(l);
}

/* ── gamble results (Gamble app subscribes; store/net publish) ─────── */

export interface GambleResult { side: 'heads' | 'tails'; won: boolean; delta: number; balance: number }

type GambleListener = (r: GambleResult) => void;
const gambleListeners = new Set<GambleListener>();

export function pushGambleResult(r: GambleResult): void {
  gambleListeners.forEach((l) => { try { l(r); } catch { /* ignore */ } });
}

export function onGambleResult(l: GambleListener): () => void {
  gambleListeners.add(l);
  return () => gambleListeners.delete(l);
}

/* ── auth error events (Login subscribes to un-stick its animation) ── */

type AuthErrorListener = (msg: string) => void;
const authErrListeners = new Set<AuthErrorListener>();

export function emitAuthError(msg: string): void {
  authErrListeners.forEach((l) => { try { l(msg); } catch { /* ignore */ } });
}

export function onAuthError(l: AuthErrorListener): () => void {
  authErrListeners.add(l);
  return () => authErrListeners.delete(l);
}

/* ── terminal feedback (Terminal shows server results inline) ───────── */

export interface ServerFeedback { kind: 'good' | 'bad' | 'info'; text: string }
type ServerFeedbackListener = (f: ServerFeedback) => void;
const feedbackListeners = new Set<ServerFeedbackListener>();

export function pushServerFeedback(f: ServerFeedback): void {
  feedbackListeners.forEach((l) => { try { l(f); } catch { /* ignore */ } });
}

export function onServerFeedback(l: ServerFeedbackListener): () => void {
  feedbackListeners.add(l);
  return () => feedbackListeners.delete(l);
}
