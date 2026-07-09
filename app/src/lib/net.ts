import { useOS, calcHash } from '../store/os';
import { CHARACTERS, SHOP } from '../apps/registry';
import { sanitizeCoins, sanitizeCoin, finiteNum, safeStr, isUsername } from './validate';
import { setNetSender, pushNetChirp, seedNetChirps, emitAuthError, pushGambleResult, type NetAction, type NetChirp } from './netBus';
import type { Coin } from '../os/types';

/**
 * Multiplayer client. Connects to the authoritative game server; while
 * connected ("online"), the server owns all shared state and this module
 * applies its events to the store. If no server is reachable, the game
 * stays fully playable in the original local single-player mode.
 *
 * Defense in depth: even though the server is trusted, every incoming
 * payload still goes through the same sanitizers as localStorage and
 * BroadcastChannel data — a compromised or buggy server can't inject
 * malformed state into the app.
 */

const TOKEN_KEY = 'trenchos_token';
const URL: string = (import.meta as { env?: Record<string, string> }).env?.VITE_SERVER_URL ?? 'ws://localhost:8787';

let ws: WebSocket | null = null;
let backoffMs = 1000;
let closedForever = false;
let pendingRegister: { username: string; characterId: string } | null = null;

function getToken(): string | null {
  try {
    const t = localStorage.getItem(TOKEN_KEY);
    return t && /^[a-f0-9]{64}$/.test(t) ? t : null;
  } catch { return null; }
}

function saveToken(t: string): void {
  try { localStorage.setItem(TOKEN_KEY, t); } catch { /* storage blocked */ }
}

export function dropToken(): void {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
}

function send(a: NetAction): void {
  if (ws?.readyState === WebSocket.OPEN) ws.send(JSON.stringify(a));
}

/** Called by Login when the server is reachable and the player picked a character. */
export function netRegister(username: string, characterId: string): void {
  if (!isUsername(username)) return;
  pendingRegister = { username, characterId };
  send({ t: 'register', username, characterId });
}

export function initNet(): void {
  if (ws || closedForever) return;
  connect();
}

function connect(): void {
  let socket: WebSocket;
  try { socket = new WebSocket(URL); } catch { scheduleReconnect(); return; }
  ws = socket;

  socket.onopen = () => {
    backoffMs = 1000;
    useOS.setState({ netReady: true });
    const token = getToken();
    if (token) send({ t: 'auth', token });
    else if (pendingRegister) send({ t: 'register', ...pendingRegister });
  };

  socket.onmessage = (ev) => {
    if (typeof ev.data !== 'string' || ev.data.length > 262_144) return;
    let msg: unknown;
    try { msg = JSON.parse(ev.data); } catch { return; }
    try { apply(msg); } catch { /* one bad event must not kill the client */ }
  };

  socket.onclose = () => {
    ws = null;
    setNetSender(null);
    const wasOnline = useOS.getState().online;
    useOS.setState({ netReady: false, online: false, onlineCount: 0 });
    if (wasOnline) useOS.getState().toast('Server connection lost — back to solo trenches.', 'info');
    scheduleReconnect();
  };

  socket.onerror = () => { try { socket.close(); } catch { /* already closing */ } };
}

function scheduleReconnect(): void {
  if (closedForever) return;
  setTimeout(connect, backoffMs + Math.random() * 500);
  backoffMs = Math.min(15_000, backoffMs * 2);
}

/* ── applying server events (all payloads re-validated) ────────────── */

function toClientCoin(v: unknown): Coin | null { return sanitizeCoin(v); }

function toNetChirp(v: unknown): NetChirp | null {
  if (typeof v !== 'object' || v === null) return null;
  const o = v as Record<string, unknown>;
  const id = finiteNum(o.id, 0, Number.MAX_SAFE_INTEGER);
  const name = safeStr(o.name, 24);
  const handle = safeStr(o.handle, 24);
  const body = safeStr(o.body, 280);
  const likes = finiteNum(o.likes, 0, 1e12) ?? 0;
  const reposts = finiteNum(o.reposts, 0, 1e12) ?? 0;
  const followers = finiteNum(o.followers, 0, 1e12) ?? 0;
  const at = finiteNum(o.at, 0, 8.64e15) ?? Date.now();
  if (id === null || !name || !handle || !body) return null;
  return { id, name, handle, body, verified: o.verified === true, larp: o.larp === true || undefined, likes, reposts, followers, at };
}

function applyWallet(o: Record<string, unknown>): void {
  const balance = finiteNum(o.balance, 0, 1e15);
  const clout = finiteNum(o.clout, -1e9, 1e9);
  const followers = finiteNum(o.followers, 0, 1e12);
  if (balance === null || clout === null || followers === null) return;
  const owned: Record<string, boolean> = {};
  if (Array.isArray(o.owned)) for (const id of o.owned) if (typeof id === 'string' && SHOP.some((i) => i.id === id)) owned[id] = true;
  const holdings: Record<string, number> = {};
  if (typeof o.holdings === 'object' && o.holdings !== null) {
    for (const [k, val] of Object.entries(o.holdings as Record<string, unknown>)) {
      const n = finiteNum(val, 0, 1e15);
      if (n !== null && /^[a-z0-9_-]{1,16}$/.test(k)) holdings[k] = n;
    }
  }
  useOS.setState({
    balance, balanceHash: calcHash(balance),
    clout, cloutHash: calcHash(clout),
    followers, blueCheck: o.blueCheck === true, owned, holdings,
  });
}

function apply(raw: unknown): void {
  if (typeof raw !== 'object' || raw === null) return;
  const m = raw as Record<string, unknown>;

  switch (m.t) {
    case 'registered': {
      if (typeof m.token === 'string' && /^[a-f0-9]{64}$/.test(m.token)) saveToken(m.token);
      pendingRegister = null;
      return;
    }

    case 'auth_ok': {
      const p = (m.profile ?? {}) as Record<string, unknown>;
      const username = isUsername(p.username) ? (p.username as string) : null;
      const characterId = typeof p.characterId === 'string' ? p.characterId : '';
      const chosen = CHARACTERS.find((c) => c.id === characterId) ?? null;
      const coins = sanitizeCoins(m.coins);
      if (!username || !chosen || !coins) {
        console.error('Multiplayer auth_ok validation failed:', {
          usernameValid: !!username,
          chosenValid: !!chosen,
          coinsValid: !!coins,
          rawProfile: p,
          rawCoins: m.coins
        });
        return;
      }

      setNetSender(send);
      applyWallet(p);
      const chirps = Array.isArray(m.chirps) ? (m.chirps as unknown[]).map(toNetChirp).filter((c): c is NetChirp => !!c) : [];
      seedNetChirps(chirps);
      const online = finiteNum(m.online, 0, 1e6) ?? 1;
      useOS.setState({
        online: true, onlineCount: online,
        chosen, username, handle: username.toLowerCase(),
        coins, cheater: false, phase: 'desktop',
      });
      useOS.getState().toast(`Connected — ${online} degen${online === 1 ? '' : 's'} in the trenches.`, 'good');
      return;
    }

    case 'tick': {
      if (!Array.isArray(m.prices) || m.prices.length > 100) return;
      const s = useOS.getState();
      if (!s.online) return;
      const byId = new Map<string, { price: number; change: number }>();
      for (const p of m.prices as unknown[]) {
        const o = p as Record<string, unknown>;
        const price = finiteNum(o.price, 0, 1e12);
        const change = finiteNum(o.change, -100, 1e6);
        if (typeof o.id === 'string' && price !== null && change !== null) byId.set(o.id, { price, change });
      }
      useOS.setState({
        coins: s.coins.map((c) => {
          const u = byId.get(c.id);
          if (!u) return c;
          return { ...c, price: u.price, change: u.change, up: u.change >= 0, hist: [...c.hist.slice(1), u.price] };
        }),
      });
      return;
    }

    case 'coin_launched': {
      const coin = toClientCoin(m.coin);
      const by = safeStr(m.by, 16) ?? 'someone';
      if (!coin) return;
      const s = useOS.getState();
      if (!s.coins.some((c) => c.id === coin.id)) {
        useOS.setState({ coins: [...s.coins, coin] });
        if (s.username !== by) s.toast(`@${by} deployed $${coin.ticker} 🚀`, 'info');
      }
      return;
    }

    case 'trade': {
      const price = finiteNum(m.price, 0, 1e12);
      const change = finiteNum(m.change, -100, 1e6);
      if (typeof m.coinId !== 'string' || price === null || change === null) return;
      const s = useOS.getState();
      useOS.setState({
        coins: s.coins.map((c) => c.id === m.coinId
          ? { ...c, price, change, up: change >= 0, hist: [...c.hist.slice(1), price] }
          : c),
      });
      return;
    }

    case 'wallet': applyWallet(m); return;

    case 'gamble_result': {
      const side = m.side === 'heads' || m.side === 'tails' ? m.side : null;
      const delta = finiteNum(m.delta, -1e6, 1e6);
      const balance = finiteNum(m.balance, 0, 1e15);
      if (!side || delta === null || balance === null) return;
      useOS.setState({ balance, balanceHash: calcHash(balance) });
      pushGambleResult({ side, won: m.won === true, delta, balance });
      return;
    }

    case 'chirp': {
      const post = toNetChirp(m.post);
      if (post) pushNetChirp(post);
      return;
    }

    case 'notice': {
      const msg = safeStr(m.msg, 120);
      const kind = m.kind === 'good' || m.kind === 'bad' ? m.kind : 'info';
      if (msg) useOS.getState().toast(msg, kind);
      return;
    }

    case 'online': {
      const n = finiteNum(m.count, 0, 1e6);
      if (n !== null) useOS.setState({ onlineCount: n });
      return;
    }

    case 'error': {
      const code = safeStr(m.code, 32) ?? 'error';
      const msg = safeStr(m.msg, 160) ?? 'Server error.';
      if (code === 'bad_token') { dropToken(); return; }
      // Any error while a register is pending must un-stick the login screen
      // immediately (name taken, rate limited, anything) — never leave the
      // player staring at a faded screen.
      if (pendingRegister) { pendingRegister = null; emitAuthError(msg); }
      useOS.getState().toast(msg, 'bad');
      return;
    }

    default: return; // unknown event types are ignored, never crash
  }
}
