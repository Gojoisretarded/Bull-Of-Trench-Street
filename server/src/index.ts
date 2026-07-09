import http from 'node:http';
import { WebSocketServer, WebSocket } from 'ws';
import { CONFIG } from './config.js';
import { openDb } from './db.js';
import { Engine, type UserState } from './engine.js';
import { ClientMsg, type ServerMsg } from './protocol.js';
import { TokenBucket, WindowCounter } from './ratelimit.js';

/**
 * WebSocket gateway. Responsibilities:
 *  - Origin allowlist, connection caps (global / per IP / per user)
 *  - Message size caps + JSON + zod validation before anything else runs
 *  - Per-connection rate limiting, per-action cooldowns
 *  - Auth session tracking; heartbeat to reap dead sockets
 *  - Never leaks internals: clients get short error codes, details go to logs
 */

interface Session {
  ws: WebSocket;
  ip: string;
  user: UserState | null;
  bucket: TokenBucket;
  alive: boolean;
  lastAction: Map<string, number>;
}

const db = openDb();
const sessions = new Set<Session>();
const ipCounts = new Map<string, number>();
const registerLimiter = new WindowCounter(3_600_000, CONFIG.registerPerIpPerHour);

function send(ws: WebSocket, msg: ServerMsg): void {
  if (ws.readyState === WebSocket.OPEN) ws.send(JSON.stringify(msg));
}

function broadcast(msg: ServerMsg): void {
  const data = JSON.stringify(msg);
  for (const s of sessions) if (s.user && s.ws.readyState === WebSocket.OPEN) s.ws.send(data);
}

function toUser(userId: string, msg: ServerMsg): void {
  const data = JSON.stringify(msg);
  for (const s of sessions) if (s.user?.id === userId && s.ws.readyState === WebSocket.OPEN) s.ws.send(data);
}

const engine = new Engine(db, broadcast, toUser);

function onlineUserIds(): string[] {
  const ids = new Set<string>();
  for (const s of sessions) if (s.user) ids.add(s.user.id);
  return [...ids];
}

function onlineCount(): number { return onlineUserIds().length; }

/* ── HTTP server (health check only — no user content, strict headers) ── */

const httpServer = http.createServer((req, res) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Content-Security-Policy', "default-src 'none'");
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ ok: true, online: onlineCount() }));
    return;
  }
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end('{"error":"not_found"}');
});

/* ── WebSocket server ──────────────────────────────────────────────── */

const wss = new WebSocketServer({
  server: httpServer,
  maxPayload: CONFIG.maxPayloadBytes,
  verifyClient: (info: { origin?: string; req: http.IncomingMessage }, done: (ok: boolean, code?: number) => void) => {
    // Browsers always send Origin; reject anything not on the allowlist.
    // (Non-browser clients can fake this — real protection is auth + validation.)
    if (info.origin && !CONFIG.allowedOrigins.includes(info.origin)) return done(false, 403);
    if (sessions.size >= CONFIG.maxConnections) return done(false, 503);
    done(true);
  },
});

function clientIp(req: http.IncomingMessage): string {
  // Only trust the socket address by default. If deployed behind a proxy,
  // set TRUST_PROXY=1 and the proxy must overwrite x-forwarded-for.
  if (process.env.TRUST_PROXY === '1') {
    const fwd = req.headers['x-forwarded-for'];
    if (typeof fwd === 'string' && fwd.length < 64) return fwd.split(',')[0]!.trim();
  }
  return req.socket.remoteAddress ?? 'unknown';
}

function cooldownOk(s: Session, key: string, ms: number): boolean {
  const now = Date.now();
  const last = s.lastAction.get(key) ?? 0;
  if (now - last < ms) return false;
  s.lastAction.set(key, now);
  return true;
}

wss.on('connection', (ws, req) => {
  const ip = clientIp(req);
  const perIp = (ipCounts.get(ip) ?? 0) + 1;
  if (perIp > CONFIG.maxConnectionsPerIp) { ws.close(1013, 'too many connections'); return; }
  ipCounts.set(ip, perIp);

  const session: Session = {
    ws, ip, user: null,
    bucket: new TokenBucket(CONFIG.msgRatePerSec, CONFIG.msgBurst),
    alive: true,
    lastAction: new Map(),
  };
  sessions.add(session);

  ws.on('pong', () => { session.alive = true; });

  ws.on('message', (raw) => {
    if (!session.bucket.take()) { ws.close(1008, 'rate limit'); return; }

    let parsed: unknown;
    try { parsed = JSON.parse(String(raw)); } catch { send(ws, { t: 'error', code: 'bad_json', msg: 'Malformed message.' }); return; }
    const result = ClientMsg.safeParse(parsed);
    if (!result.success) { send(ws, { t: 'error', code: 'bad_msg', msg: 'Invalid message.' }); return; }
    const msg = result.data;

    try {
      handle(session, msg);
    } catch (e) {
      // Never leak stack traces to clients.
      console.error('[handler]', (e as Error).message);
      send(ws, { t: 'error', code: 'internal', msg: 'Something broke. Try again.' });
    }
  });

  ws.on('close', () => {
    sessions.delete(session);
    const n = (ipCounts.get(ip) ?? 1) - 1;
    if (n <= 0) ipCounts.delete(ip); else ipCounts.set(ip, n);
    broadcast({ t: 'online', count: onlineCount() });
  });

  ws.on('error', () => { /* handled by close */ });
});

function sessionsForUser(userId: string): number {
  let n = 0;
  for (const s of sessions) if (s.user?.id === userId) n++;
  return n;
}

function handle(s: Session, msg: ClientMsg): void {
  switch (msg.t) {
    case 'ping': send(s.ws, { t: 'pong' }); return;

    case 'register': {
      if (s.user) { send(s.ws, { t: 'error', code: 'already_auth', msg: 'Already logged in.' }); return; }
      if (!registerLimiter.take(s.ip)) { send(s.ws, { t: 'error', code: 'slow_down', msg: 'Too many new accounts. Try later.' }); return; }
      const res = engine.register(msg.username, msg.characterId);
      if ('error' in res) { const e = res.error as { code: string; msg: string }; send(s.ws, { t: 'error', code: e.code, msg: e.msg }); return; }
      s.user = res.user;
      send(s.ws, { t: 'registered', token: res.token, profile: engine.toWireProfile(res.user) });
      send(s.ws, { t: 'auth_ok', profile: engine.toWireProfile(res.user), coins: engine.allWireCoins(), chirps: engine.recentWireChirps(), online: onlineCount() });
      broadcast({ t: 'online', count: onlineCount() });
      return;
    }

    case 'auth': {
      if (s.user) { send(s.ws, { t: 'error', code: 'already_auth', msg: 'Already logged in.' }); return; }
      const user = engine.auth(msg.token);
      if (!user) { send(s.ws, { t: 'error', code: 'bad_token', msg: 'Session invalid. Log in again.' }); return; }
      if (sessionsForUser(user.id) >= CONFIG.maxSessionsPerUser) { send(s.ws, { t: 'error', code: 'too_many_tabs', msg: 'Too many open tabs for this account.' }); return; }
      s.user = user;
      send(s.ws, { t: 'auth_ok', profile: engine.toWireProfile(user), coins: engine.allWireCoins(), chirps: engine.recentWireChirps(), online: onlineCount() });
      broadcast({ t: 'online', count: onlineCount() });
      return;
    }

    default: break;
  }

  // ── everything below requires auth ─────────────────────────────
  const u = s.user;
  if (!u) { send(s.ws, { t: 'error', code: 'auth_required', msg: 'Log in first.' }); return; }

  switch (msg.t) {
    case 'trade': {
      if (!cooldownOk(s, 'trade', CONFIG.tradeCooldownMs)) { send(s.ws, { t: 'error', code: 'slow_down', msg: 'Trading too fast.' }); return; }
      const r = engine.trade(u, msg.kind, msg.coinId, msg.amountUsd);
      if (!r.ok) send(s.ws, { t: 'error', code: r.code, msg: r.msg });
      return;
    }
    case 'launch': {
      if (!cooldownOk(s, 'launch', CONFIG.launchCooldownMs)) { send(s.ws, { t: 'error', code: 'slow_down', msg: 'One launch per minute. Touch grass.' }); return; }
      const r = engine.launch(u, msg.name, msg.ticker);
      if (!r.ok) { s.lastAction.delete('launch'); send(s.ws, { t: 'error', code: r.code, msg: r.msg }); }
      return;
    }
    case 'chirp': {
      if (!cooldownOk(s, 'chirp', CONFIG.chirpCooldownMs)) { send(s.ws, { t: 'error', code: 'slow_down', msg: 'Chirping too fast.' }); return; }
      const r = engine.chirp(u, msg.kind, msg.body);
      if (!r.ok) send(s.ws, { t: 'error', code: r.code, msg: r.msg });
      return;
    }
    case 'buy_item': {
      if (!cooldownOk(s, 'buy', 500)) { send(s.ws, { t: 'error', code: 'slow_down', msg: 'Slow down.' }); return; }
      const r = engine.buyItem(u, msg.itemId);
      if (!r.ok) send(s.ws, { t: 'error', code: r.code, msg: r.msg });
      return;
    }
  }
}

/* ── game loop + heartbeat + cleanup ───────────────────────────────── */

const tickTimer = setInterval(() => {
  try { engine.tick(onlineUserIds()); } catch (e) { console.error('[tick]', (e as Error).message); }
}, CONFIG.tickMs);

const heartbeatTimer = setInterval(() => {
  for (const s of sessions) {
    if (!s.alive) { s.ws.terminate(); continue; }
    s.alive = false;
    try { s.ws.ping(); } catch { /* closing */ }
  }
  registerLimiter.sweep();
}, 30_000);

function shutdown(): void {
  console.log('shutting down…');
  clearInterval(tickTimer);
  clearInterval(heartbeatTimer);
  engine.persistCoins();
  for (const s of sessions) s.ws.close(1001, 'server restarting');
  wss.close();
  httpServer.close(() => process.exit(0));
  setTimeout(() => process.exit(0), 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

httpServer.listen(CONFIG.port, () => {
  console.log(`Bull of Trench Street server listening on :${CONFIG.port}`);
  console.log(`allowed origins: ${CONFIG.allowedOrigins.join(', ')}`);
});
