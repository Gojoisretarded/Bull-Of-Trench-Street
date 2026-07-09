import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { AppId, WinState, Character, Coin, Toast, ToastKind, ShopItem, Txn } from '../os/types';
import { initialCoins, tickCoins, hist } from '../lib/market';
import { fmtK, fmtBal } from '../lib/format';
import { sfx } from '../lib/sound';
import { CHARACTERS, SHOP } from '../apps/registry';
import { publish, subscribe, isLeader } from '../lib/sync';
import { netSend } from '../lib/netBus';
import {
  isUsername, sanitizeCoins, sanitizeTxns, sanitizeHoldings, sanitizeOwned,
  sanitizeWallpaper, resolveCharacter, finiteNum, safeStr, TICKER_RE,
} from '../lib/validate';

export const TOPBAR = 44;

const SAVE_KEY = 'trenchos_save';
const SALT_KEY = 'trenchos_salt';

const DEFAULT: Record<AppId, { x: number | 'r'; y: number; w: number; h: number }> = {
  degenfun: { x: 90, y: 66, w: 780, h: 520 },
  chirper: { x: 'r', y: 86, w: 400, h: 510 },
  wallet: { x: 220, y: 130, w: 340, h: 330 },
  terminal: { x: 180, y: 150, w: 540, h: 330 },
  darkweb: { x: 140, y: 100, w: 780, h: 520 },
  internet: { x: 160, y: 110, w: 780, h: 520 },
  files: { x: 180, y: 120, w: 780, h: 520 },
  chudmail: { x: 200, y: 130, w: 780, h: 520 },
  gamble: { x: 220, y: 140, w: 780, h: 520 },
  launchpad: { x: 260, y: 110, w: 380, h: 440 },
  settings: { x: 280, y: 150, w: 420, h: 290 },
};

/* ── anti-cheat salt & checksum ──────────────────────────────────────────
 * The salt persists in localStorage so saved hashes stay verifiable across
 * reloads. If the salt is missing/invalid while a save exists, we can no
 * longer verify that save's integrity — it is discarded (fail-closed) rather
 * than trusted. The hash is a keyed double-FNV-1a over the exact value, which
 * is much harder to eyeball-forge than the old `round(v*420.69)+69420`.
 * (Honest limit: this is a deterrent, not real security — everything runs in
 * the player's own browser and nothing here protects anyone but the player
 * from themselves.)
 */
function genSalt(): string {
  try {
    const b = new Uint8Array(16);
    crypto.getRandomValues(b);
    return Array.from(b, (x) => x.toString(16).padStart(2, '0')).join('');
  } catch {
    return Math.random().toString(36).slice(2) + Math.random().toString(36).slice(2);
  }
}

let saltWasFresh = false;
const SALT: string = (() => {
  try {
    const s = localStorage.getItem(SALT_KEY);
    if (s && /^[A-Za-z0-9]{16,64}$/.test(s)) return s;
  } catch { /* storage blocked */ }
  saltWasFresh = true;
  const fresh = genSalt();
  try { localStorage.setItem(SALT_KEY, fresh); } catch { /* storage blocked */ }
  return fresh;
})();

function fnv(str: string): string {
  let h1 = 0x811c9dc5 >>> 0;
  let h2 = 0xcbf29ce4 >>> 0;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    h1 = Math.imul(h1 ^ c, 0x01000193) >>> 0;
    h2 = Math.imul(h2 ^ ((c * 31 + i) & 0xffff), 0x01000193) >>> 0;
  }
  return h1.toString(16).padStart(8, '0') + h2.toString(16).padStart(8, '0');
}

export const calcHash = (val: number) => fnv(`v:${val}|s:${SALT}`);

/** Wipe the save, salt and server session token. Used by the power/log-off button. */
export function wipeSave(): void {
  try { useOS.persist.clearStorage(); } catch { /* ignore */ }
  try { localStorage.removeItem(SALT_KEY); } catch { /* ignore */ }
  try { localStorage.removeItem('trenchos_token'); } catch { /* ignore */ }
  try {
    useOS.setState({
      chosen: null,
      username: '',
      handle: '',
      balance: 5,
      balanceHash: calcHash(5),
      clout: 0,
      cloutHash: calcHash(0),
      cheater: false,
      followers: 0,
      owned: {},
      blueCheck: false,
      txns: [],
      coins: initialCoins(),
      holdings: {},
      wallpaper: 'sonoma',
      phase: 'boot',
      wins: {},
    });
  } catch { /* ignore */ }
}

let toastSeq = 1;
let txnSeq = Date.now() % 1_000_000; // avoid txn id collisions across reloads
const mkTxn = (label: string, delta: number): Txn => ({ id: txnSeq++, label, delta, kind: delta >= 0 ? 'in' : 'out', t: Date.now() });

interface OSState {
  phase: 'boot' | 'login' | 'desktop';
  chosen: Character | null;
  username: string;
  handle: string;
  balance: number;
  balanceHash: string;
  clout: number;
  cloutHash: string;
  cheater: boolean;
  followers: number;
  owned: Record<string, boolean>;
  blueCheck: boolean;
  txns: Txn[];
  coins: Coin[];
  wins: Partial<Record<AppId, WinState>>;
  z: number;
  overview: boolean;
  muted: boolean;
  gridOpen: boolean;
  toasts: Toast[];

  holdings: Record<string, number>; // coinId -> token quantity owned
  wallpaper: 'sonoma' | 'blueprint' | 'code' | 'helloworld';

  // multiplayer status (never persisted)
  netReady: boolean;    // socket open — server reachable
  online: boolean;      // authenticated — server owns shared state
  onlineCount: number;  // degens currently connected

  setPhase: (p: OSState['phase']) => void;
  choose: (c: Character, username: string) => void;
  setGrid: (b: boolean) => void;
  setWallpaper: (wp: OSState['wallpaper']) => void;

  openApp: (id: AppId) => void;
  closeApp: (id: AppId) => void;
  minApp: (id: AppId) => void;
  restoreApp: (id: AppId) => void;
  toggleMax: (id: AppId) => void;
  focusApp: (id: AppId) => void;
  setGeom: (id: AppId, patch: Partial<Pick<WinState, 'x' | 'y' | 'w' | 'h' | 'max'>>) => void;

  tick: () => void;
  trade: (kind: 'buy' | 'sell', amount: number, coinId: string) => void;
  addClout: (clout: number, followers?: number) => void;
  buyItem: (item: ShopItem) => void;
  launchCoin: (name: string, ticker: string, desc: string) => boolean;

  toast: (text: string, kind?: ToastKind) => void;
  dropToast: (id: number) => void;

  toggleOverview: (force?: boolean) => void;
  toggleMuted: () => void;
}

/* Fields that get written to localStorage. Everything transient (windows,
 * toasts, overlay state) stays in memory only. */
type SavedSlice = Pick<OSState,
  'chosen' | 'username' | 'handle' | 'balance' | 'balanceHash' | 'clout' | 'cloutHash' |
  'cheater' | 'followers' | 'owned' | 'blueCheck' | 'txns' | 'coins' | 'holdings' | 'wallpaper'>;

/**
 * Rebuild persisted state from untrusted localStorage JSON.
 * Allowlist every field; anything malformed falls back to a fresh game.
 * After structural validation the anti-cheat checksums are re-verified —
 * a save whose numbers were edited by hand gets the rug screen, exactly
 * like live memory tampering.
 */
function restoreSave(persisted: unknown, current: OSState): OSState {
  if (saltWasFresh) return current; // save can't be verified without its salt
  if (typeof persisted !== 'object' || persisted === null) return current;
  const p = persisted as Record<string, unknown>;

  const chosen = resolveCharacter(p.chosen, CHARACTERS);
  const username = isUsername(p.username) ? (p.username as string) : null;
  if (!chosen || !username) return current; // never finished login — fresh game

  const balance = finiteNum(p.balance, 0, 1e15);
  const clout = finiteNum(p.clout, -1e9, 1e9);
  const followers = finiteNum(p.followers, 0, 1e12) ?? 0;
  const balanceHash = safeStr(p.balanceHash, 64) ?? '';
  const cloutHash = safeStr(p.cloutHash, 64) ?? '';
  if (balance === null || clout === null) return current;

  const restored: OSState = {
    ...current,
    chosen,
    username,
    handle: username.toLowerCase(),
    balance,
    balanceHash,
    clout,
    cloutHash,
    cheater: p.cheater === true,
    followers,
    blueCheck: p.blueCheck === true,
    owned: sanitizeOwned(p.owned, SHOP.map((i) => i.id)),
    txns: sanitizeTxns(p.txns),
    coins: sanitizeCoins(p.coins) ?? initialCoins(),
    holdings: sanitizeHoldings(p.holdings),
    wallpaper: sanitizeWallpaper(p.wallpaper) ?? 'sonoma',
  };

  // Integrity re-check across the reload boundary.
  if (calcHash(restored.balance) !== restored.balanceHash || calcHash(restored.clout) !== restored.cloutHash) {
    return {
      ...restored,
      cheater: true,
      balance: 0, balanceHash: calcHash(0),
      clout: -9999, cloutHash: calcHash(-9999),
    };
  }
  return restored;
}

export const useOS = create<OSState>()(persist((set, get) => ({
  phase: 'boot',
  chosen: null,
  username: '',
  handle: '',
  balance: 5,
  balanceHash: calcHash(5),
  clout: 0,
  cloutHash: calcHash(0),
  cheater: false,
  followers: 0,
  owned: {},
  blueCheck: false,
  txns: [],
  coins: initialCoins(),
  wins: {},
  z: 10,
  overview: false,
  muted: false,
  gridOpen: false,
  toasts: [],
  holdings: {},
  wallpaper: 'sonoma',
  netReady: false,
  online: false,
  onlineCount: 0,

  setPhase: (p) => set({ phase: p }),

  choose: (c, username) => {
    if (!isUsername(username)) { sfx.err(); get().toast('Handle must be 3-16 letters, numbers or _', 'bad'); return; }
    const handle = username.toLowerCase();
    set({
      chosen: c, username, handle,
      balance: c.bag, balanceHash: calcHash(c.bag),
      clout: 0, cloutHash: calcHash(0),
      cheater: false, followers: 0, blueCheck: false,
      owned: {}, txns: [], holdings: {},
    });
    publish({ type: 'PROFILE_UPDATED', username, handle, chosenId: c.id });
  },

  setGrid: (b) => set({ gridOpen: b }),
  setWallpaper: (wp) => set({ wallpaper: wp }),

  openApp: (id) => {
    const s = get();
    const existing = s.wins[id];
    if (existing) { if (existing.min) get().restoreApp(id); else get().focusApp(id); return; }
    const d = DEFAULT[id];
    const vw = window.innerWidth, vh = window.innerHeight;
    let x = d.x === 'r' ? vw - d.w - 28 : d.x;
    x = Math.max(8, Math.min(x, vw - 120));
    const y = Math.max(TOPBAR + 6, Math.min(d.y, vh - 160));
    const z = s.z + 1;
    const win: WinState = {
      id, x, y,
      w: Math.min(d.w, vw - 40),
      h: Math.min(d.h, vh - TOPBAR - 100),
      z, min: false, max: false,
    };
    set({ wins: { ...s.wins, [id]: win }, z });
  },

  closeApp: (id) => {
    const wins = { ...get().wins }; delete wins[id]; set({ wins });
  },

  minApp: (id) => {
    const w = get().wins[id]; if (!w) return;
    set({ wins: { ...get().wins, [id]: { ...w, min: true } } });
  },

  restoreApp: (id) => {
    const s = get(); const w = s.wins[id]; if (!w) return;
    const z = s.z + 1;
    set({ wins: { ...s.wins, [id]: { ...w, min: false, z } }, z });
  },

  toggleMax: (id) => {
    const w = get().wins[id]; if (!w) return;
    set({ wins: { ...get().wins, [id]: { ...w, max: !w.max } } });
  },

  focusApp: (id) => {
    const s = get(); const w = s.wins[id]; if (!w) return;
    const z = s.z + 1;
    set({ wins: { ...s.wins, [id]: { ...w, z } }, z });
  },

  setGeom: (id, patch) => {
    const w = get().wins[id]; if (!w) return;
    set({ wins: { ...get().wins, [id]: { ...w, ...patch } } });
  },

  tick: () => {
    const s = get();
    // Validate anti-cheat hashes before running the tick
    if (calcHash(s.balance) !== s.balanceHash || calcHash(s.clout) !== s.cloutHash) {
      if (!s.cheater) {
        set({ cheater: true, balance: 0, balanceHash: calcHash(0), clout: -9999, cloutHash: calcHash(-9999) });
      }
      return;
    }
    if (s.online) return; // multiplayer: the server drives the market
    if (s.overview) return;
    // Only the leader tab advances the market (and earns miner income) —
    // follower tabs receive MARKET_TICK broadcasts instead. This keeps
    // prices identical everywhere and prevents multi-tab miner stacking.
    if (!isLeader()) return;
    const nextCoins = tickCoins(s.coins);
    if (s.owned.miner) {
      const nextBal = s.balance + 0.02;
      set({ coins: nextCoins, balance: nextBal, balanceHash: calcHash(nextBal) });
      publish({ type: 'MARKET_TICK', coins: nextCoins, balance: nextBal });
    } else {
      set({ coins: nextCoins });
      publish({ type: 'MARKET_TICK', coins: nextCoins });
    }
  },

  addClout: (clout, followers = 0) => {
    if (!Number.isFinite(clout) || !Number.isFinite(followers)) return;
    const nextClout = Math.max(0, get().clout + clout);
    set({ clout: nextClout, cloutHash: calcHash(nextClout), followers: Math.max(0, get().followers + followers) });
  },

  buyItem: (item) => {
    const s = get();
    if (s.online) { netSend({ t: 'buy_item', itemId: item.id }); return; } // server validates & echoes wallet
    if (!item.repurchasable && s.owned[item.id]) { sfx.err(); s.toast('Already owned.', 'bad'); return; }
    if (s.balance < item.price) { sfx.err(); s.toast(`Need ${fmtBal(item.price)}. You have ${fmtBal(s.balance)}.`, 'bad'); return; }
    const nextBal = s.balance - item.price;
    set({ balance: nextBal, balanceHash: calcHash(nextBal), owned: { ...s.owned, [item.id]: true }, txns: [mkTxn(`Bought ${item.title}`, -item.price), ...s.txns].slice(0, 40) });
    sfx.coin();
    switch (item.effect) {
      case 'miner': s.toast('Miner installed. Passive $ incoming.', 'good'); break;
      case 'followers': s.addClout(item.clout ?? 0, item.amount ?? 0); s.toast(`+${fmtK(item.amount ?? 0)} followers incoming!`, 'good'); break;
      case 'bluecheck': set({ blueCheck: true }); s.addClout(item.clout ?? 0); s.toast('Verified! Blue check unlocked.', 'good'); break;
      case 'protection': s.toast('Protection active. Drainers blocked (for now).', 'good'); break;
      case 'rig': s.toast('Extraction rig acquired. Targets coming with PvP.', 'good'); break;
    }
    // Mirror the purchase (and any clout/follower side effects) to other tabs.
    const after = get();
    publish({
      type: 'WALLET_SYNC',
      balance: after.balance, clout: after.clout, followers: after.followers,
      blueCheck: after.blueCheck, ownedIds: Object.keys(after.owned), txns: after.txns,
    });
  },

  trade: (kind, amount, coinId) => {
    const s = get();
    const coin = s.coins.find((c) => c.id === coinId || c.ticker === coinId);
    if (!coin) { sfx.err(); s.toast('Coin not found.', 'bad'); return; }
    if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) { sfx.err(); s.toast('Invalid amount', 'bad'); return; }
    if (s.online) { sfx.coin(); netSend({ t: 'trade', kind, coinId: coin.id, amountUsd: amount }); return; } // server executes & broadcasts

    const curHoldings = s.holdings[coin.id] || 0;

    if (kind === 'buy') {
      if (amount > s.balance) { sfx.err(); s.toast('Insufficient funds. Cope.', 'bad'); return; }

      const tokensBought = amount / coin.price;
      const priceImpact = 1 + (amount / (s.balance + 100)) * 0.4 + (Math.random() * 0.02);
      const newPrice = coin.price * priceImpact;
      const nextHist = [...coin.hist.slice(1), newPrice];

      let updatedCoin = coin;
      const updatedCoins = s.coins.map((c) => {
        if (c.id !== coin.id) return c;
        const change = c.change + ((newPrice - coin.price) / coin.price) * 100;
        updatedCoin = { ...c, price: newPrice, hist: nextHist, change: Math.max(-98, change) };
        return updatedCoin;
      });

      const nextBal = s.balance - amount;
      const nextHoldings = { ...s.holdings, [coin.id]: curHoldings + tokensBought };
      const nextTxns = [mkTxn(`Bought $${coin.ticker}`, -amount), ...s.txns].slice(0, 40);
      set({
        balance: nextBal,
        balanceHash: calcHash(nextBal),
        holdings: nextHoldings,
        coins: updatedCoins,
        txns: nextTxns,
      });
      publish({ type: 'TRADE_EXECUTED', coin: updatedCoin, balance: nextBal, holdings: nextHoldings, txns: nextTxns });
      sfx.coin();
      s.toast(`Bought ${tokensBought.toLocaleString(undefined, { maximumFractionDigits: 0 })} $${coin.ticker} for ${fmtBal(amount)}`, 'good');
    } else {
      // Selling
      const tokensToSell = amount / coin.price;
      const actualTokensToSell = Math.min(tokensToSell, curHoldings);
      if (actualTokensToSell <= 0) { sfx.err(); s.toast(`No $${coin.ticker} to sell.`, 'bad'); return; }

      const cashPayout = actualTokensToSell * coin.price;
      const priceImpact = 1 - (cashPayout / (s.balance + 100)) * 0.35 - (Math.random() * 0.02);
      const newPrice = Math.max(0.00001, coin.price * priceImpact);
      const nextHist = [...coin.hist.slice(1), newPrice];

      let updatedCoin = coin;
      const updatedCoins = s.coins.map((c) => {
        if (c.id !== coin.id) return c;
        const change = c.change - ((coin.price - newPrice) / coin.price) * 100;
        updatedCoin = { ...c, price: newPrice, hist: nextHist, change: Math.max(-98, change) };
        return updatedCoin;
      });

      const nextBal = s.balance + cashPayout;
      const nextHoldings = { ...s.holdings, [coin.id]: Math.max(0, curHoldings - actualTokensToSell) };
      const nextTxns = [mkTxn(`Sold $${coin.ticker}`, cashPayout), ...s.txns].slice(0, 40);
      set({
        balance: nextBal,
        balanceHash: calcHash(nextBal),
        holdings: nextHoldings,
        coins: updatedCoins,
        txns: nextTxns,
      });
      publish({ type: 'TRADE_EXECUTED', coin: updatedCoin, balance: nextBal, holdings: nextHoldings, txns: nextTxns });
      sfx.coin();
      s.toast(`Sold ${actualTokensToSell.toLocaleString(undefined, { maximumFractionDigits: 0 })} $${coin.ticker} for ${fmtBal(cashPayout)}`, 'sell');
    }
  },

  toast: (text, kind = 'info') => {
    const t: Toast = { id: toastSeq++, text, kind };
    set({ toasts: [...get().toasts, t] });
    setTimeout(() => get().dropToast(t.id), 2600);
  },
  dropToast: (id) => set({ toasts: get().toasts.filter((t) => t.id !== id) }),

  toggleOverview: (force) => {
    const next = force ?? !get().overview;
    if (next === get().overview) return;
    if (next && Object.keys(get().wins).length === 0) {
      get().toast('Nothing open. Open something. Lose money.', 'bad');
      return;
    }
    sfx.ov();
    set({ overview: next });
  },

  toggleMuted: () => set({ muted: !get().muted }),

  launchCoin: (name, ticker, desc) => {
    void desc; // narrative flavor only — never stored or rendered raw
    const s = get();
    const fee = 1.00;
    const cleanTicker = String(ticker ?? '').trim().toUpperCase().replace(/^\$/, '');
    if (!TICKER_RE.test(cleanTicker)) { sfx.err(); s.toast('Ticker must be 2-8 letters/numbers.', 'bad'); return false; }
    const cleanName = safeStr(name, 24) ?? `$${cleanTicker}`;
    if (s.online) { sfx.coin(); netSend({ t: 'launch', name: cleanName, ticker: cleanTicker }); return true; } // server validates fee/uniqueness
    if (s.balance < fee) { sfx.err(); s.toast(`Need ${fmtBal(fee)} to deploy. You have ${fmtBal(s.balance)}.`, 'bad'); return false; }
    if (s.coins.some((c) => c.ticker === cleanTicker)) { sfx.err(); s.toast(`$${cleanTicker} already exists.`, 'bad'); return false; }
    const startPrice = 0.0001 + Math.random() * 0.005;
    const newCoin: Coin = { id: cleanTicker.toLowerCase(), name: cleanName, ticker: cleanTicker, price: startPrice, change: 0, up: true, mcap: '$0', hist: hist(startPrice, true) };
    const nextBal = s.balance - fee;
    const nextTxns = [mkTxn(`Launched $${cleanTicker}`, -fee), ...s.txns].slice(0, 40);
    set({ balance: nextBal, balanceHash: calcHash(nextBal), coins: [...s.coins, newCoin], txns: nextTxns });
    publish({ type: 'COIN_LAUNCHED', coin: newCoin, balance: nextBal, txns: nextTxns });
    sfx.coin();
    s.toast(`$${cleanTicker} deployed! Go shill it, degen.`, 'good');
    return true;
  },
}), {
  name: SAVE_KEY,
  version: 1,
  storage: createJSONStorage(() => localStorage),
  partialize: (s): SavedSlice => ({
    chosen: s.chosen, username: s.username, handle: s.handle,
    balance: s.balance, balanceHash: s.balanceHash,
    clout: s.clout, cloutHash: s.cloutHash,
    cheater: s.cheater, followers: s.followers,
    owned: s.owned, blueCheck: s.blueCheck,
    txns: s.txns, coins: s.coins, holdings: s.holdings,
    wallpaper: s.wallpaper,
  }),
  merge: (persisted, current) => restoreSave(persisted, current),
}));

/* ── apply incoming cross-tab events ─────────────────────────────────────
 * All payloads were already schema-validated in sync.ts. Integrity hashes
 * are recomputed locally (same persisted salt in every tab), never trusted
 * from the wire. Appliers must never publish — that would cause loops.
 */
subscribe((msg) => {
  const s = useOS.getState();
  if (s.cheater) return; // rugged tabs stay rugged
  if (s.online) return;  // multiplayer mode: the server already syncs every tab
  switch (msg.type) {
    case 'MARKET_TICK': {
      if (msg.balance !== undefined) {
        useOS.setState({ coins: msg.coins, balance: msg.balance, balanceHash: calcHash(msg.balance) });
      } else {
        useOS.setState({ coins: msg.coins });
      }
      break;
    }
    case 'COIN_LAUNCHED': {
      const exists = s.coins.some((c) => c.id === msg.coin.id || c.ticker === msg.coin.ticker);
      useOS.setState({
        coins: exists ? s.coins.map((c) => (c.id === msg.coin.id ? msg.coin : c)) : [...s.coins, msg.coin],
        balance: msg.balance, balanceHash: calcHash(msg.balance),
        txns: msg.txns,
      });
      if (!exists && s.phase === 'desktop') s.toast(`$${msg.coin.ticker} just deployed in another tab 🚀`, 'info');
      break;
    }
    case 'TRADE_EXECUTED': {
      useOS.setState({
        coins: s.coins.map((c) => (c.id === msg.coin.id ? msg.coin : c)),
        balance: msg.balance, balanceHash: calcHash(msg.balance),
        holdings: msg.holdings, txns: msg.txns,
      });
      break;
    }
    case 'WALLET_SYNC': {
      const owned: Record<string, boolean> = {};
      for (const id of msg.ownedIds) if (SHOP.some((i) => i.id === id)) owned[id] = true;
      useOS.setState({
        balance: msg.balance, balanceHash: calcHash(msg.balance),
        clout: msg.clout, cloutHash: calcHash(msg.clout),
        followers: msg.followers, blueCheck: msg.blueCheck,
        owned, txns: msg.txns,
      });
      break;
    }
    case 'CHIRP_POSTED': {
      // Feed insertion is handled by the Chirper app; here we just sync stats.
      useOS.setState({ clout: msg.clout, cloutHash: calcHash(msg.clout), followers: msg.followers });
      break;
    }
    case 'PROFILE_UPDATED': {
      // Mirror the full login, not just the name — otherwise a tab still
      // sitting at the login screen would persist `chosen: null` over the
      // fresh save and corrupt it.
      const c = CHARACTERS.find((ch) => ch.id === msg.chosenId);
      if (!c) break;
      useOS.setState({
        chosen: c, username: msg.username, handle: msg.handle,
        balance: c.bag, balanceHash: calcHash(c.bag),
        clout: 0, cloutHash: calcHash(0),
        cheater: false, followers: 0, blueCheck: false,
        owned: {}, txns: [], holdings: {},
        // Follow the other tab onto the desktop if we were still logging in.
        ...(s.phase === 'login' || s.phase === 'boot' ? { phase: 'desktop' as const } : {}),
      });
      break;
    }
    case 'HELLO':
      break; // heartbeat only — used for leader election
  }
});
