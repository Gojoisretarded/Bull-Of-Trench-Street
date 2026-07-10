import { DatabaseSync } from 'node:sqlite';
import { CONFIG } from './config.js';

/**
 * SQLite persistence via Node's built-in driver (node:sqlite, Node >= 22.5) —
 * zero native dependencies to compile. Every query is a prepared statement
 * with bound parameters — user input never touches SQL text, so injection is
 * structurally impossible. WAL mode for crash safety.
 */

export interface UserRow {
  id: string;
  username: string;
  token_hash: string;
  character_id: string;
  balance: number;
  clout: number;
  followers: number;
  blue_check: number;
  owned: string;      // JSON string[]
  holdings: string;   // JSON Record<string, number>
  created_at: number;
  last_seen: number;
  banned: number;
}

export interface CoinRow {
  id: string; name: string; ticker: string;
  price: number; change: number; up: number; rug: number;
  mcap: string; badge: string | null; hist: string; // JSON number[]
  creator_id: string | null; created_at: number;
}

export interface ChirpRow {
  id: number; user_id: string; name: string; handle: string;
  body: string; verified: number; larp: number;
  likes: number; reposts: number; followers: number; created_at: number;
}

export function openDb(file = CONFIG.dbFile) {
  const db = new DatabaseSync(file);
  db.exec('PRAGMA journal_mode = WAL;');
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      username TEXT NOT NULL UNIQUE COLLATE NOCASE,
      token_hash TEXT NOT NULL UNIQUE,
      character_id TEXT NOT NULL,
      balance REAL NOT NULL,
      clout REAL NOT NULL DEFAULT 0,
      followers REAL NOT NULL DEFAULT 0,
      blue_check INTEGER NOT NULL DEFAULT 0,
      owned TEXT NOT NULL DEFAULT '[]',
      holdings TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL,
      last_seen INTEGER NOT NULL,
      banned INTEGER NOT NULL DEFAULT 0
    );
    CREATE TABLE IF NOT EXISTS coins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      ticker TEXT NOT NULL UNIQUE COLLATE NOCASE,
      price REAL NOT NULL,
      change REAL NOT NULL,
      up INTEGER NOT NULL,
      rug INTEGER NOT NULL DEFAULT 0,
      mcap TEXT NOT NULL,
      badge TEXT,
      hist TEXT NOT NULL,
      creator_id TEXT REFERENCES users(id),
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS chirps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      handle TEXT NOT NULL,
      body TEXT NOT NULL,
      verified INTEGER NOT NULL DEFAULT 0,
      larp INTEGER NOT NULL DEFAULT 0,
      likes INTEGER NOT NULL DEFAULT 0,
      reposts INTEGER NOT NULL DEFAULT 0,
      followers INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_chirps_created ON chirps (created_at DESC);
  `);

  const stmts = {
    insertUser: db.prepare(`INSERT INTO users (id, username, token_hash, character_id, balance, created_at, last_seen)
                            VALUES (@id, @username, @token_hash, @character_id, @balance, @created_at, @last_seen)`),
    // Bot accounts: real rows so bot chirps satisfy the chirps→users foreign
    // key. banned=1 so they can never be logged into. INSERT OR IGNORE makes
    // seeding idempotent across restarts.
    insertBotUser: db.prepare(`INSERT OR IGNORE INTO users (id, username, token_hash, character_id, balance, created_at, last_seen, banned)
                               VALUES (@id, @username, @token_hash, @character_id, 0, @created_at, @created_at, 1)`),
    userByTokenHash: db.prepare(`SELECT * FROM users WHERE token_hash = ?`),
    userByUsername: db.prepare(`SELECT * FROM users WHERE username = ?`),
    updateUser: db.prepare(`UPDATE users SET balance=@balance, clout=@clout, followers=@followers,
                            blue_check=@blue_check, owned=@owned, holdings=@holdings, last_seen=@last_seen
                            WHERE id=@id`),
    updateUserIdentity: db.prepare(`UPDATE users SET username=@username, token_hash=@token_hash WHERE id=@id`),
    insertCoin: db.prepare(`INSERT INTO coins (id, name, ticker, price, change, up, rug, mcap, badge, hist, creator_id, created_at)
                            VALUES (@id, @name, @ticker, @price, @change, @up, @rug, @mcap, @badge, @hist, @creator_id, @created_at)`),
    allCoins: db.prepare(`SELECT * FROM coins ORDER BY created_at ASC`),
    updateCoin: db.prepare(`UPDATE coins SET price=@price, change=@change, up=@up, hist=@hist WHERE id=@id`),
    deleteCoin: db.prepare(`DELETE FROM coins WHERE id = ?`),
    updateCoinRug: db.prepare(`UPDATE coins SET rug=@rug, badge=@badge WHERE id=@id`),
    insertChirp: db.prepare(`INSERT INTO chirps (user_id, name, handle, body, verified, larp, likes, reposts, followers, created_at)
                             VALUES (@user_id, @name, @handle, @body, @verified, @larp, @likes, @reposts, @followers, @created_at)`),
    recentChirps: db.prepare(`SELECT * FROM chirps ORDER BY created_at DESC, id DESC LIMIT ?`),
    pruneChirps: db.prepare(`DELETE FROM chirps WHERE id NOT IN (SELECT id FROM chirps ORDER BY created_at DESC, id DESC LIMIT ?)`),
    countUsers: db.prepare(`SELECT COUNT(*) AS n FROM users`),
  };

  return { db, stmts };
}

export type Db = ReturnType<typeof openDb>;
