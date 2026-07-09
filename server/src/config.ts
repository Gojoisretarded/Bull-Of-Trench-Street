/** Server configuration — everything tunable lives here, overridable via env. */

function envInt(name: string, def: number): number {
  const v = Number(process.env[name]);
  return Number.isFinite(v) && v > 0 ? Math.floor(v) : def;
}

export const CONFIG = {
  port: envInt('PORT', 8787),
  dbFile: process.env.DB_FILE ?? 'trenchos.sqlite',

  /** Origins allowed to open a WebSocket (browser Origin header allowlist). */
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5188,http://127.0.0.1:5188')
    .split(',').map((s) => s.trim()).filter(Boolean),

  // ── hard limits (DoS / abuse protection) ──────────────────────────
  maxPayloadBytes: 4096,        // a legit message is < 1 KB
  maxConnections: 500,
  maxConnectionsPerIp: 8,
  maxSessionsPerUser: 3,        // same account in several tabs is fine, farms are not

  // token bucket per connection
  msgRatePerSec: 8,
  msgBurst: 16,

  // per-user action cooldowns (ms)
  chirpCooldownMs: 2000,
  launchCooldownMs: 60_000,
  tradeCooldownMs: 250,
  registerPerIpPerHour: 20,

  // ── game rules ────────────────────────────────────────────────────
  tickMs: 1000,
  minerIncomePerTick: 0.02,     // only while that player is connected
  launchFee: 1.0,
  maxCoins: 60,
  maxChirpsKept: 50,
  maxTradeUsd: 1_000_000,
  minTradeUsd: 0.01,
  persistEveryTicks: 10,        // flush coin prices to disk every N ticks
} as const;
