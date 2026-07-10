import crypto from 'node:crypto';
import type { Db, UserRow, CoinRow, ChirpRow } from './db.js';
import type { ServerMsg, WireCoin, WireChirp, WireProfile } from './protocol.js';
import { CONFIG } from './config.js';
import { CHARACTERS, SHOP, SEED_COINS, RESERVED_USERNAMES, seedHist } from './rules.js';

/**
 * Authoritative game engine. All mutations happen here, on server-held
 * state, after server-side checks. Clients only ever *ask*.
 */

const HIST_LEN = 30;
// Hard market bounds: keeps the economy sane and — critically — keeps every
// value inside the range clients accept. Without a ceiling, compounding buy
// impact pumped coins past 1e12, clients rejected the world, and nobody
// could log in.
const PRICE_FLOOR = 0.000001;
const PRICE_CEIL = 1e9;
const CHANGE_MIN = -98;
const CHANGE_MAX = 99_999;
const clampPrice = (p: number) => Math.max(PRICE_FLOOR, Math.min(PRICE_CEIL, p));
const clampChange = (c: number) => Math.max(CHANGE_MIN, Math.min(CHANGE_MAX, c));

export interface UserState {
  id: string;
  username: string;
  handle: string;
  characterId: string;
  startingBag: number;
  balance: number;
  clout: number;
  followers: number;
  blueCheck: boolean;
  owned: Set<string>;
  holdings: Map<string, number>;
  isAdmin?: boolean;
}

export interface CoinState {
  id: string; name: string; ticker: string;
  price: number; change: number; up: boolean; rug: boolean;
  mcap: string; badge: 'HOT' | 'RUG' | null;
  hist: number[];
  creatorName: string | null;
}

type Result = { ok: true } | { ok: false; code: string; msg: string };
const err = (code: string, msg: string): Result => ({ ok: false, code, msg });
const OK: Result = { ok: true };

/** Strip control chars, collapse whitespace, hard cap. */
function cleanText(s: string, max: number): string {
  // control chars (U+0000-U+001F, U+007F) become spaces, then whitespace collapses
  // eslint-disable-next-line no-control-regex
  return s.replace(/[\u0000-\u001F\u007F]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, max);
}

const BOT_NAMES = ['AlphaDegen', 'SolWhale', 'BagHolder', 'JeetMaster', 'RugSurvivor', 'MoonBoy', 'GigaChad', 'MemeLord', 'Degen0x', 'PumpChaser'];
const BOT_HANDLES = ['alphadegen', 'solwhale', 'bagholder', 'jeetmaster', 'rugsurvivor', 'moonboy', 'gigachad', 'memelord', 'degen0x', 'pumpchaser'];

const BOT_BUY_CHIRPS = [
  'just aped into ${ticker}, to the moon! 🚀',
  'loading up more ${ticker}, this is a gem 💎',
  'is ${ticker} the next 100x?',
  'comfy holding my ${ticker} bag, dev is cooking 🍳',
  'floor on ${ticker} looking solid, time to buy the dip!',
  'looks like whales are starting to accumulate ${ticker} 👀'
];

const BOT_SELL_CHIRPS = [
  'jeeted my ${ticker} bags, looks slow',
  'who is dumping ${ticker}? solid floor broken 😭',
  'took profits on ${ticker}, moving to next play',
  'bag got too heavy on ${ticker}, selling for now',
  'dev stopped posting on ${ticker}, looks like a fade 📉'
];

const BOT_RUG_CHIRPS = [
  'DEV RUGGED ${ticker}! Liquidated my entire bag 💀',
  'it\'s over for ${ticker}, dev just pulled the liquidity pool...',
  'who could have predicted ${ticker} would be a rug 😭',
  'dev sold everything on ${ticker}. down bad again, back to work.'
];

export class Engine {
  private coins = new Map<string, CoinState>();
  private users = new Map<string, UserState>();   // hot cache of active users
  private tickCount = 0;

  constructor(
    private store: Db,
    private broadcast: (msg: ServerMsg) => void,
    private toUser: (userId: string, msg: ServerMsg) => void,
  ) {
    this.loadCoins();
    this.seedBots();
  }

  /**
   * Seed a real user row per bot so bot chirps satisfy the chirps→users
   * foreign key (previously every bot chirp threw a constraint error that was
   * silently swallowed, so no bot chatter ever appeared). banned=1 keeps them
   * unusable as login accounts; INSERT OR IGNORE makes this safe on restart.
   */
  private seedBots(): void {
    const now = Date.now();
    for (const handle of BOT_HANDLES) {
      try {
        this.store.stmts.insertBotUser.run({
          id: 'bot_' + handle,
          username: 'bot_' + handle,               // distinct from the display handle → no clash with real players
          token_hash: 'bot_' + crypto.randomBytes(16).toString('hex'),
          character_id: 'orphan',
          created_at: now,
        });
      } catch (e) {
        console.error('[bot seed error]', (e as Error).message);
      }
    }
  }

  /* ── loading & persistence ─────────────────────────────────────── */

  private loadCoins(): void {
    const rows = this.store.stmts.allCoins.all() as unknown as CoinRow[];
    if (rows.length === 0) {
      const now = Date.now();
      for (const c of SEED_COINS) {
        this.store.stmts.insertCoin.run({
          id: c.id, name: c.name, ticker: c.ticker, price: c.price, change: c.change,
          up: c.up ? 1 : 0, rug: c.rug ? 1 : 0, mcap: c.mcap, badge: c.badge ?? null,
          hist: JSON.stringify(seedHist(c.price, c.up)), creator_id: null, created_at: now,
        });
      }
      return this.loadCoins();
    }
    for (const r of rows) {
      let hist: number[] = [];
      try { hist = JSON.parse(r.hist); } catch { /* re-seed below */ }
      if (!Array.isArray(hist) || hist.length < 2) hist = seedHist(r.price, r.up === 1);
      // Self-heal: clamp any out-of-bounds values persisted before the
      // market bounds existed, so a poisoned database can't brick logins.
      const price = clampPrice(Number.isFinite(r.price) ? r.price : PRICE_FLOOR);
      this.coins.set(r.id, {
        id: r.id, name: r.name, ticker: r.ticker, price,
        change: clampChange(Number.isFinite(r.change) ? r.change : 0),
        up: r.up === 1, rug: r.rug === 1, mcap: r.mcap,
        badge: (r.badge === 'HOT' || r.badge === 'RUG') ? r.badge : null,
        hist: hist.slice(-HIST_LEN).map((h) => clampPrice(Number.isFinite(h) ? h : price)),
        creatorName: null,
      });
    }
    this.persistCoins(); // write the healed values back immediately
  }

  private persistUser(u: UserState): void {
    this.store.stmts.updateUser.run({
      id: u.id, balance: u.balance, clout: u.clout, followers: u.followers,
      blue_check: u.blueCheck ? 1 : 0,
      owned: JSON.stringify([...u.owned]),
      holdings: JSON.stringify(Object.fromEntries(u.holdings)),
      last_seen: Date.now(),
    });
  }

  persistCoins(): void {
    for (const c of this.coins.values()) {
      this.store.stmts.updateCoin.run({
        id: c.id, price: c.price, change: c.change, up: c.up ? 1 : 0,
        hist: JSON.stringify(c.hist),
      });
    }
  }

  /* ── accounts ──────────────────────────────────────────────────── */

  static hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  /** Create an account. Returns the one-time plaintext token. */
  register(usernameRaw: string, characterId: string): { token: string; user: UserState } | { error: Result } {
    const username = usernameRaw; // format already zod-validated
    if (RESERVED_USERNAMES.has(username.toLowerCase())) return { error: err('name_taken', 'That handle is reserved.') };
    const character = CHARACTERS.find((c) => c.id === characterId);
    if (!character) return { error: err('bad_character', 'Unknown character.') };
    if (this.store.stmts.userByUsername.get(username)) return { error: err('name_taken', 'That handle is already taken.') };

    const token = crypto.randomBytes(32).toString('hex');
    const id = crypto.randomUUID();
    const now = Date.now();
    try {
      this.store.stmts.insertUser.run({
        id, username, token_hash: Engine.hashToken(token),
        character_id: character.id, balance: character.bag, created_at: now, last_seen: now,
      });
    } catch {
      return { error: err('name_taken', 'That handle is already taken.') }; // unique-race safety net
    }
    const user: UserState = {
      id, username, handle: username.toLowerCase(), characterId: character.id,
      startingBag: character.bag, balance: character.bag,
      clout: 0, followers: 0, blueCheck: false, owned: new Set(), holdings: new Map(),
    };
    this.users.set(id, user);
    return { token, user };
  }

  /** Authenticate with a token (constant-time hash comparison via lookup on digest). */
  auth(token: string): UserState | null {
    const row = this.store.stmts.userByTokenHash.get(Engine.hashToken(token)) as unknown as UserRow | undefined;
    if (!row || row.banned) return null;
    const cached = this.users.get(row.id);
    if (cached) return cached;
    const character = CHARACTERS.find((c) => c.id === row.character_id);
    let owned: string[] = []; let holdings: Record<string, number> = {};
    try { owned = JSON.parse(row.owned); } catch { /* default */ }
    try { holdings = JSON.parse(row.holdings); } catch { /* default */ }
    const user: UserState = {
      id: row.id, username: row.username, handle: row.username.toLowerCase(),
      characterId: row.character_id, startingBag: character?.bag ?? 5,
      balance: row.balance, clout: row.clout, followers: row.followers,
      blueCheck: row.blue_check === 1,
      owned: new Set(Array.isArray(owned) ? owned.filter((x) => typeof x === 'string') : []),
      holdings: new Map(Object.entries(holdings).filter(([, v]) => Number.isFinite(v) && (v as number) >= 0) as [string, number][]),
    };
    this.users.set(user.id, user);
    return user;
  }

  /* ── wire shapes ───────────────────────────────────────────────── */

  toWireProfile(u: UserState): WireProfile {
    return {
      username: u.username, handle: u.handle, characterId: u.characterId,
      balance: round2(u.balance), clout: Math.round(u.clout), followers: Math.round(u.followers),
      blueCheck: u.blueCheck, owned: [...u.owned], holdings: Object.fromEntries(u.holdings),
    };
  }

  toWireCoin(c: CoinState): WireCoin {
    return {
      id: c.id, name: c.name, ticker: c.ticker, price: c.price, change: c.change,
      mcap: c.mcap, up: c.change >= 0, rug: c.rug || undefined, badge: c.badge ?? undefined,
      hist: c.hist, creator: c.creatorName ?? undefined,
    };
  }

  allWireCoins(): WireCoin[] { return [...this.coins.values()].map((c) => this.toWireCoin(c)); }

  recentWireChirps(): WireChirp[] {
    const rows = this.store.stmts.recentChirps.all(CONFIG.maxChirpsKept) as unknown as ChirpRow[];
    return rows.map((r) => ({
      id: r.id, name: r.name, handle: r.handle, body: r.body,
      verified: r.verified === 1, larp: r.larp === 1 || undefined,
      likes: r.likes, reposts: r.reposts, followers: r.followers, at: r.created_at,
    }));
  }

  private sendWallet(u: UserState): void {
    this.toUser(u.id, {
      t: 'wallet', balance: round2(u.balance), clout: Math.round(u.clout),
      followers: Math.round(u.followers), blueCheck: u.blueCheck,
      owned: [...u.owned], holdings: Object.fromEntries(u.holdings),
    });
  }

  /* ── market tick ───────────────────────────────────────────────── */

  tick(onlineUserIds: string[]): void {
    this.tickCount++;

    // 1. Dynamic Creator Rug-Pulls
    const coinList = [...this.coins.values()];
    for (const c of coinList) {
      // Seed coins (grump, cmr, dhd, hodl) are protected and don't rug.
      if (!c.rug && !['grump', 'cmr', 'dhd', 'hodl'].includes(c.id)) {
        // 0.1% chance per tick to rug once it has achieved some value
        if (c.price > 0.005 && Math.random() < 0.001) {
          c.rug = true;
          c.badge = 'RUG';
          try {
            this.store.stmts.updateCoinRug.run({ id: c.id, rug: 1, badge: 'RUG' });
          } catch (e) {
            console.error('[rug persistence error]', (e as Error).message);
          }

          // Post complaint chirp from a bot
          const botIdx = Math.floor(Math.random() * BOT_NAMES.length);
          const botName = BOT_NAMES[botIdx]!;
          const botHandle = BOT_HANDLES[botIdx]!;
          const template = BOT_RUG_CHIRPS[Math.floor(Math.random() * BOT_RUG_CHIRPS.length)]!;
          const chirpBody = template.replace(/\$\{ticker\}/g, `$${c.ticker}`);
          const now = Date.now();
          try {
            const info = this.store.stmts.insertChirp.run({
              user_id: 'bot_' + botHandle, name: botName, handle: botHandle, body: chirpBody,
              verified: 0, larp: 0, likes: Math.floor(Math.random() * 40 + 10),
              reposts: Math.floor(Math.random() * 10 + 2), followers: Math.floor(1000 + Math.random() * 8000), created_at: now,
            });
            this.store.stmts.pruneChirps.run(CONFIG.maxChirpsKept);
            this.broadcast({
              t: 'chirp',
              post: {
                id: Number(info.lastInsertRowid), name: botName, handle: botHandle, body: chirpBody,
                verified: false, likes: 0, reposts: 0, followers: Math.floor(1000 + Math.random() * 8000), at: now,
              }
            });
          } catch (e) {
            console.error('[rug chirp error]', (e as Error).message);
          }
        }
      }
    }

    // 2. Simulated Background Bot Trading
    if (coinList.length > 0 && Math.random() < 0.15) {
      const coin = coinList[Math.floor(Math.random() * coinList.length)]!;
      let side: 'buy' | 'sell';
      if (coin.rug) {
        side = 'sell';
      } else if (coin.price > 0.5) {
        // Whale profit-taking
        side = Math.random() < 0.65 ? 'sell' : 'buy';
      } else if (coin.up) {
        // Trend following
        side = Math.random() < 0.60 ? 'buy' : 'sell';
      } else {
        side = Math.random() < 0.50 ? 'buy' : 'sell';
      }

      const botIdx = Math.floor(Math.random() * BOT_NAMES.length);
      const botName = BOT_NAMES[botIdx]!;
      const botHandle = BOT_HANDLES[botIdx]!;
      const amountUsd = round2(50 + Math.random() * 3950);

      if (side === 'buy') {
        const impact = 1 + Math.min(0.25, amountUsd / 2000) * 0.4 + Math.random() * 0.01;
        this.applyPrice(coin, coin.price * impact);
      } else {
        const impact = 1 - Math.min(0.25, amountUsd / 2000) * 0.35 - Math.random() * 0.01;
        this.applyPrice(coin, Math.max(0.000001, coin.price * impact));
      }

      this.broadcast({ t: 'trade', coinId: coin.id, price: coin.price, change: coin.change, side, usd: amountUsd, by: botName });

      // 15% chance to chirp about the trade
      if (Math.random() < 0.15) {
        const templates = side === 'buy' ? BOT_BUY_CHIRPS : BOT_SELL_CHIRPS;
        const template = templates[Math.floor(Math.random() * templates.length)]!;
        const chirpBody = template.replace(/\$\{ticker\}/g, `$${coin.ticker}`);
        const now = Date.now();
        try {
          const info = this.store.stmts.insertChirp.run({
            user_id: 'bot_' + botHandle, name: botName, handle: botHandle, body: chirpBody,
            verified: Math.random() < 0.2 ? 1 : 0, larp: 0, likes: Math.floor(Math.random() * 20),
            reposts: Math.floor(Math.random() * 5), followers: Math.floor(100 + Math.random() * 5000), created_at: now,
          });
          this.store.stmts.pruneChirps.run(CONFIG.maxChirpsKept);
          this.broadcast({
            t: 'chirp',
            post: {
              id: Number(info.lastInsertRowid), name: botName, handle: botHandle, body: chirpBody,
              verified: Math.random() < 0.2, likes: 0, reposts: 0, followers: Math.floor(100 + Math.random() * 5000), at: now,
            }
          });
        } catch (e) {
          console.error('[bot chirp error]', (e as Error).message);
        }
      }
    }

    // 3. Random Walk Price Tick
    const prices: { id: string; price: number; change: number }[] = [];
    for (const c of this.coins.values()) {
      const last = c.hist[c.hist.length - 1] ?? c.price;
      const drift = c.rug ? -last * 0.04 : (c.up ? last * 0.0015 : -last * 0.0015);
      const noise = (Math.random() - 0.50) * last * 0.07;
      const nv = clampPrice(last + drift + noise);
      c.hist = [...c.hist.slice(-(HIST_LEN - 1)), nv];
      let change = c.change + ((nv - last) / Math.max(c.price, 1e-9)) * 100;
      if (c.rug) change = Math.min(change, -8);
      c.change = Math.max(-96, Math.min(9999, change));
      c.price = nv;
      c.up = c.change >= 0;
      prices.push({ id: c.id, price: nv, change: c.change });
    }
    this.broadcast({ t: 'tick', prices });

    // miner income only for connected owners — no idle farming, no multi-tab stacking
    for (const id of onlineUserIds) {
      const u = this.users.get(id);
      if (u?.owned.has('miner')) {
        u.balance = round2(u.balance + CONFIG.minerIncomePerTick);
        if (this.tickCount % 5 === 0) { this.persistUser(u); this.sendWallet(u); }
      }
    }

    if (this.tickCount % CONFIG.persistEveryTicks === 0) this.persistCoins();
  }

  /* ── actions (all server-validated) ────────────────────────────── */

  trade(u: UserState, kind: 'buy' | 'sell', coinId: string, amountUsd: number): Result {
    const coin = this.coins.get(coinId);
    if (!coin) return err('no_coin', 'Coin not found.');
    if (amountUsd < CONFIG.minTradeUsd || amountUsd > CONFIG.maxTradeUsd) return err('bad_amount', 'Invalid amount.');

    if (kind === 'buy') {
      if (amountUsd > u.balance) return err('poor', 'Insufficient funds. Cope.');
      const tokens = amountUsd / coin.price;
      const impact = 1 + Math.min(0.25, amountUsd / 2000) * 0.4 + Math.random() * 0.01;
      this.applyPrice(coin, coin.price * impact);
      u.balance = round2(u.balance - amountUsd);
      u.holdings.set(coin.id, (u.holdings.get(coin.id) ?? 0) + tokens);
    } else {
      const held = u.holdings.get(coin.id) ?? 0;
      const tokensToSell = Math.min(amountUsd / coin.price, held);
      if (tokensToSell <= 0) return err('no_bags', `No $${coin.ticker} to sell.`);
      const payout = tokensToSell * coin.price;
      const impact = 1 - Math.min(0.25, payout / 2000) * 0.35 - Math.random() * 0.01;
      this.applyPrice(coin, Math.max(0.000001, coin.price * impact));
      u.balance = round2(u.balance + payout);
      const remaining = held - tokensToSell;
      if (remaining > 1e-9) u.holdings.set(coin.id, remaining); else u.holdings.delete(coin.id);
      amountUsd = payout;
    }

    this.persistUser(u);
    this.sendWallet(u);
    this.broadcast({ t: 'trade', coinId: coin.id, price: coin.price, change: coin.change, side: kind, usd: round2(amountUsd), by: u.username });
    return OK;
  }

  private applyPrice(coin: CoinState, newPrice: number): void {
    const old = coin.price;
    const price = clampPrice(newPrice);
    coin.change = clampChange(coin.change + ((price - old) / Math.max(old, 1e-9)) * 100);
    coin.price = price;
    coin.up = coin.change >= 0;
    coin.hist = [...coin.hist.slice(-(HIST_LEN - 1)), price];
  }

  launch(u: UserState, nameRaw: string, tickerRaw: string): Result {
    const ticker = tickerRaw.trim().toUpperCase().replace(/^\$/, '');
    if (!/^[A-Z0-9]{2,8}$/.test(ticker)) return err('bad_ticker', 'Ticker must be 2-8 letters/numbers.');
    const name = cleanText(nameRaw, 24) || `$${ticker}`;
    if (u.balance < CONFIG.launchFee) return err('poor', `Need $${CONFIG.launchFee.toFixed(2)} to deploy.`);
    if (this.coins.size >= CONFIG.maxCoins) return err('market_full', 'Market saturated. Wait for a rug.');
    const id = ticker.toLowerCase();
    if (this.coins.has(id) || [...this.coins.values()].some((c) => c.ticker === ticker)) {
      return err('ticker_taken', `$${ticker} already exists.`);
    }

    const price = 0.0001 + Math.random() * 0.005;
    const coin: CoinState = {
      id, name, ticker, price, change: 0, up: true, rug: false,
      mcap: '$0', badge: null, hist: seedHist(price, true), creatorName: u.username,
    };
    this.coins.set(id, coin);
    this.store.stmts.insertCoin.run({
      id, name, ticker, price, change: 0, up: 1, rug: 0, mcap: '$0', badge: null,
      hist: JSON.stringify(coin.hist), creator_id: u.id, created_at: Date.now(),
    });

    u.balance = round2(u.balance - CONFIG.launchFee);
    this.persistUser(u);
    this.sendWallet(u);
    this.broadcast({ t: 'coin_launched', coin: this.toWireCoin(coin), by: u.username });
    return OK;
  }

  chirp(u: UserState, kind: 'chirp' | 'flex' | 'larp', bodyRaw?: string): Result {
    let body: string;
    let larp = false;
    let cloutDelta = 0;
    let followerDelta = 0;
    let notice: ServerMsg | null = null;

    switch (kind) {
      case 'chirp': {
        body = cleanText(bodyRaw ?? '', 280);
        if (!body) return err('empty', 'Say something, degen.');
        cloutDelta = 12; followerDelta = 5;
        notice = { t: 'notice', kind: 'good', msg: 'Chirped. Clout +12' };
        break;
      }
      case 'flex': {
        const pnl = ((u.balance - u.startingBag) / u.startingBag) * 100;
        if (pnl <= 5) return err('down_bad', 'Down bad. Nothing to flex (honestly).');
        const gain = Math.min(2000, Math.round(pnl * 6));
        body = `up +${pnl.toFixed(0)}% on my bag 📈 receipts attached`;
        cloutDelta = gain; followerDelta = Math.round(pnl * 10);
        notice = { t: 'notice', kind: 'good', msg: `Flexed +${pnl.toFixed(0)}% (verified). Clout +${gain}` };
        break;
      }
      case 'larp': {
        const fake = 400 + Math.floor(Math.random() * 3000);
        const caught = Math.random() < 0.32;
        body = `just took +${fake}% on a 3AM ape 🚀🚀 trust me bro`;
        larp = caught;
        if (caught) {
          cloutDelta = -Math.round(fake * 0.4); followerDelta = -Math.round(fake * 3);
          notice = { t: 'notice', kind: 'bad', msg: 'CAUGHT LARPING. Chart was photoshopped. Clout nuked.' };
        } else {
          cloutDelta = Math.round(fake * 0.5); followerDelta = fake * 4;
          notice = { t: 'notice', kind: 'good', msg: `Larp landed. Nobody checked. Clout +${Math.round(fake * 0.5)}` };
        }
        break;
      }
    }

    u.clout = Math.max(0, u.clout + cloutDelta);
    u.followers = Math.max(0, u.followers + followerDelta);
    const now = Date.now();
    const info = this.store.stmts.insertChirp.run({
      user_id: u.id, name: u.username, handle: u.handle, body,
      verified: u.blueCheck ? 1 : 0, larp: larp ? 1 : 0, likes: 0, reposts: 0,
      followers: Math.round(u.followers), created_at: now,
    });
    this.store.stmts.pruneChirps.run(CONFIG.maxChirpsKept);
    this.persistUser(u);

    const post: WireChirp = {
      id: Number(info.lastInsertRowid), name: u.username, handle: u.handle, body,
      verified: u.blueCheck, larp: larp || undefined, likes: 0, reposts: 0,
      followers: Math.round(u.followers), at: now,
    };
    this.broadcast({ t: 'chirp', post });
    this.sendWallet(u);
    if (notice) this.toUser(u.id, notice);
    return OK;
  }

  /**
   * Voluntary log-off & wipe: frees the player's handle for re-use and
   * invalidates the token. The row is renamed (not deleted) so foreign keys
   * from coins/chirps stay intact. Only the authenticated owner can do this.
   */
  unregister(u: UserState): Result {
    for (let attempt = 0; attempt < 3; attempt++) {
      const ghost = `xdegen_${crypto.randomBytes(3).toString('hex')}`; // 13 chars, valid + unguessable
      try {
        this.store.stmts.updateUserIdentity.run({
          id: u.id, username: ghost, token_hash: Engine.hashToken(crypto.randomBytes(32).toString('hex')),
        });
        this.users.delete(u.id);
        return OK;
      } catch { /* astronomically unlikely name collision — retry */ }
    }
    return err('internal', 'Could not release the handle. Try again.');
  }

  /** Server-side coinflip — the house edge and the balance both live here. */
  gamble(u: UserState, pick: 'heads' | 'tails', amountUsd: number): Result {
    if (amountUsd < CONFIG.minTradeUsd || amountUsd > CONFIG.maxTradeUsd) return err('bad_amount', 'Invalid bet.');
    if (amountUsd > u.balance) return err('poor', 'Insufficient funds. Cope.');
    const won = Math.random() < 0.48;
    const side: 'heads' | 'tails' = won ? pick : (pick === 'heads' ? 'tails' : 'heads');
    const delta = won ? amountUsd : -amountUsd;
    u.balance = round2(Math.max(0, u.balance + delta));
    this.persistUser(u);
    this.sendWallet(u);
    this.toUser(u.id, { t: 'gamble_result', side, won, delta: round2(delta), balance: u.balance });
    return OK;
  }

  buyItem(u: UserState, itemId: string): Result {
    const item = SHOP.find((i) => i.id === itemId);
    if (!item || !item.enabled) return err('no_item', 'Item not available.');
    if (!item.repurchasable && u.owned.has(item.id)) return err('owned', 'Already owned.');
    if (u.balance < item.price) return err('poor', `Need $${item.price.toFixed(2)}.`);

    u.balance = round2(u.balance - item.price);
    u.owned.add(item.id);
    if (item.effect === 'bluecheck') u.blueCheck = true;
    if (item.clout) u.clout = Math.max(0, u.clout + item.clout);
    if (item.amount) u.followers = Math.max(0, u.followers + item.amount);

    this.persistUser(u);
    this.sendWallet(u);
    this.toUser(u.id, { t: 'notice', kind: 'good', msg: 'Purchase complete.' });
    return OK;
  }

  adminAuth(u: UserState, token: string): Result {
    // Fail-safe: if no ADMIN_TOKEN is configured, admin is disabled entirely.
    if (!CONFIG.adminToken) return err('admin_denied', 'Admin is not enabled on this server.');
    // Constant-time comparison so response timing can't leak the token.
    const a = Buffer.from(token);
    const b = Buffer.from(CONFIG.adminToken);
    const okLen = a.length === b.length;
    // Compare against a same-length buffer to keep timingSafeEqual from throwing.
    const match = okLen && crypto.timingSafeEqual(a, b);
    if (!match) return err('admin_denied', 'Invalid admin credentials.');
    u.isAdmin = true;
    this.toUser(u.id, { t: 'admin_ok' });
    return OK;
  }

  deleteCoin(u: UserState, ticker: string): Result {
    if (!u.isAdmin) return err('forbidden', 'Admin credentials required. Run: sudo auth <token>');
    const id = ticker.toLowerCase().replace(/^\$/, '');
    const coin = this.coins.get(id);
    if (!coin) return err('no_coin', 'Coin not found.');

    this.coins.delete(id);
    this.store.stmts.deleteCoin.run(id);
    this.broadcast({ t: 'coin_deleted', coinId: id });
    return OK;
  }
}

function round2(n: number): number { return Math.round(n * 100) / 100; }
