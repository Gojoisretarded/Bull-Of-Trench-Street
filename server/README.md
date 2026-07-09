# Bull of Trench Street — Multiplayer Server

The authoritative game server. It owns the market, balances, coins and the
chirp feed; browsers only send *intents* which are validated here.

## Run it (local)

```bash
cd server
npm install
npm run dev          # starts on ws://localhost:8787
```

Then start the game as usual (`cd app && npm run dev`). The login screen
shows `● multiplayer server online` when the app finds the server. Without
the server the game still works in solo mode.

Player data is stored in `server/trenchos.sqlite` — back up or delete that
file to back up or reset the world.

## Configuration (environment variables)

| Variable          | Default                              | Meaning                             |
| ----------------- | ------------------------------------ | ----------------------------------- |
| `PORT`            | `8787`                               | Listen port                         |
| `DB_FILE`         | `trenchos.sqlite`                    | SQLite database path                |
| `ALLOWED_ORIGINS` | `http://localhost:5188,...127.0.0.1` | Comma-separated browser origins     |
| `TRUST_PROXY`     | unset                                | Set `1` only behind a proxy you own |

## Deploying for friends on the internet

1. Host this folder on any Node 20+ host (Fly.io / Railway / Render free tiers work).
2. Set `ALLOWED_ORIGINS` to wherever the app is served from (e.g. `https://yourgame.example`).
3. Serve everything over HTTPS/WSS (hosts do this for you) and set
   `VITE_SERVER_URL=wss://your-server-host` when building the app.

## Security model (short version)

- Server-authoritative: clients cannot set balances, prices or clout — they
  ask, the server checks (funds, ownership, cooldowns, caps) and decides.
- Anonymous token auth: 32 random bytes per account, stored only as a SHA-256
  hash. No emails, no passwords, nothing worth stealing.
- Every message is schema-validated (zod), size-capped (4 KB) and rate-limited
  (per-connection token bucket + per-action cooldowns + per-IP caps).
- All SQL uses bound parameters — injection is structurally impossible.
- Errors sent to clients are generic; details stay in server logs.
