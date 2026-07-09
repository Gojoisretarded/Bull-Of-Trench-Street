# Session Handoff: Bull of Trench Street ($BOTS) — Persistence, Cross-Tab Sync & Real Multiplayer
**Date:** 2026-07-09
**Handoff #:** 1
**Session descriptor:** Full build — client persistence/sync + authoritative multiplayer server, tested end-to-end
**Depth level:** Deep
**Prepared for:** Next Claude session

> **Session Continuity note:** This is an ongoing build. Two major layers were designed,
> implemented AND test-verified this session. Nothing is half-done in the code; the only
> unverified step is running it on Samuel's own Windows machine.

---

## 1. Mission

Samuel is building **Bull of Trench Street** — a satirical Solana-degen trading simulator styled
as a fake desktop OS (project folder: `C:\Users\samue\Desktop\Mystery project`, active app in
`app/`, a second older copy `degensimulation/` exists but was untouched). The mission evolved
during the session: it started as "add localStorage persistence, custom usernames, and cross-tab
BroadcastChannel sync, maximum security" and expanded (at Samuel's explicit request) into
"**real multiplayer**: different users on different computers see each other's coins and chirps,
with a safe, best-practice backend." Samuel self-describes as having little backend knowledge, so
security had to be handled *for* him and explained simply. Note: despite the crypto theming, this
is a **game with fake money — no blockchain, wallets, or real funds anywhere**.

---

## 2. Current State (What Is True Right Now)

**Everything described below is implemented, typechecked, built, and passing tests.**

### Client (`Mystery project/app/` — React 18 + Zustand 4 + Vite, dev port 5188)
- **Persistence:** game state saved to localStorage key `trenchos_save` via Zustand persist;
  anti-cheat salt in `trenchos_salt` (crypto-random, persisted so checksums survive reloads).
  Checksum = salt-keyed double FNV-1a (`calcHash` in `store/os.ts`), replacing the old trivially
  forgeable `round(v*420.69)+69420`. Saves are re-verified on load: edited saves → cheater/rug
  screen; missing salt → save discarded (fail-closed); corrupted JSON → clean fresh game.
- **Custom usernames:** Login screen has a handle input (`/^[A-Za-z0-9_]{3,16}$/`), pre-filled
  per character (orphan→`orphan_degen`, fumbler→`fumbler_99`, nepo→`nepo_prince`,
  addict→`one_last_win`). Username/handle shown in TopBar, Wallet, Chirper, Desktop greeting.
- **Cross-tab sync (offline mode):** BroadcastChannel `trenchos_sync` (`lib/sync.ts`) with
  per-tab IDs, strict message validation, rate limiting (40 msg/s), and **leader election**
  (lowest tab ID ticks the market + earns miner income → blocks multi-tab miner farming).
- **Multiplayer client:** `lib/net.ts` (WebSocket, reconnect w/ exponential backoff,
  token auth) + `lib/netBus.ts` (indirection so `os.ts` never imports `net.ts` — no cycles).
  When online: store actions (`trade`, `launchCoin`, `buyItem`, Chirper chirp/flex/larp) send
  intents to the server instead of mutating locally; local tick + BroadcastChannel appliers are
  disabled. When no server is reachable, the game runs fully in the original local mode.
  Login shows `● multiplayer server online` / `○ offline — solo trenches`; TopBar shows a green
  online-player counter.
- **Power button:** confirms, then wipes `trenchos_save`, `trenchos_salt`, `trenchos_token`
  and reloads → login screen. Plain F5 keeps progress (offline) / re-auths with token (online).

### Server (`Mystery project/server/` — new this session)
- Node + TypeScript, run with `tsx`. Deps: only `ws`, `zod`, `tsx` (+ types). **SQLite via
  Node's built-in `node:sqlite`** — zero native deps. HTTP `/health` + WebSocket on port 8787.
- Authoritative: owns market tick (1s), prices, balances, holdings, coins, chirps, clout.
  Clients send intents; server validates funds/ownership/cooldowns/caps and broadcasts results.
- Anonymous auth: 32-byte hex token issued at register, stored as SHA-256 hash; client keeps it
  in localStorage `trenchos_token`.
- Files: `src/config.ts` (all tunables), `src/protocol.ts` (zod schemas), `src/rules.ts`
  (canonical characters/shop/seed coins/reserved usernames), `src/db.ts`, `src/ratelimit.ts`
  (token bucket + window counter), `src/engine.ts` (game logic), `src/index.ts` (gateway),
  `README.md` (run/deploy/security docs).

### Test status (all in the Cowork sandbox — see Section 10 gotchas)
- 12/12 store integration tests (persistence, tamper→rug, corrupted save, salt deletion,
  forged BroadcastChannel messages, cross-tab sync).
- jsdom full-UI run: boot→login→desktop, reload retention, cross-tab chirps, power-off wipe.
- 9/9 multiplayer E2E (real server + two jsdom "computers" over real WebSockets): register,
  live player counter, coin visible cross-player, chirp visible cross-player, duplicate username
  rejected, token re-auth after reload, attack suite (malformed JSON / unauth / NaN / XSS name /
  reserved name `admin` / forged token / overdraw / phantom-sell / disabled item / duplicate
  ticker all rejected; flood → disconnect), and state survives full server restart.

### Last thing agreed
Samuel asked about capacity; answered: ~100 concurrent players easy, ~500 the honest single-process
ceiling (configured cap), hosting tier is the real constraint. Then he requested this handoff.

---

## 3. Work Completed This Session

- Built client persistence layer (Zustand persist + sanitizing `merge` + salt-keyed checksums).
- Built `lib/validate.ts` — allowlist sanitizers reused across localStorage, BroadcastChannel,
  and server payloads (defense in depth; prototype-pollution safe by rebuilding objects).
- Built `lib/sync.ts` — cross-tab sync with leader election; closed multi-tab miner exploit.
- Added username/handle system end-to-end (Login input, store, TopBar, Wallet, Chirper).
- Fixed a real bug tests caught: a tab idling at Login could persist `chosen: null` over a good
  save → `PROFILE_UPDATED` now carries `chosenId` and login-screen tabs follow to desktop.
- Built the entire multiplayer server (see Section 2) + client wiring + offline fallback.
- Switched better-sqlite3 → `node:sqlite` after native build failure (better anyway: zero deps).
- Wrote and passed 3 test suites (store, UI, multiplayer E2E incl. attack suite + persistence).
- Wrote `server/README.md` with run, config, deploy, and security-model docs.

---

## 4. Active Tasks & Next Steps

### Immediate (start here):
- [ ] **Have Samuel run it locally and confirm**: terminal 1 `cd server && npm install && npm run dev`,
  terminal 2 `cd app && npm run dev`, open `http://localhost:5188` in two different browsers
  (e.g. Chrome + Edge) and verify two players see each other's coins/chirps. Everything passed in
  the sandbox but has NOT yet been run on Samuel's Windows machine.
- [ ] **Fix `server/package.json` engines field**: currently `">=20"` but `node:sqlite` requires
  **Node ≥ 22.5**. Check Samuel's `node --version` first; if he's on 20/21, either upgrade Node
  or swap back to better-sqlite3.

### Queued:
- [ ] Deploy for internet play: host `server/` on Fly.io/Railway/Render, set `ALLOWED_ORIGINS`
  to the app's origin, build app with `VITE_SERVER_URL=wss://…` (README documents this).
- [ ] Moderation tooling: `users.banned` column already exists in the DB — add a way to set it
  (even just a documented SQL one-liner) and consider a chirp report/mute path.

### Parked / Later:
- [ ] Leaderboard (top balances) — deliberately cut for scope this session.
- [ ] Show coin `creator` username in Degen.Fun UI (server already sends it on `coin_launched`).
- [ ] Postgres + multi-instance scaling — only if community exceeds ~500 concurrent.
- [ ] PvP / extraction-rig mechanics hinted at in shop items ("Targets coming with PvP").

---

## 5. Key Decisions & Rationale

| Decision | Chosen Option | Confidence | Rationale | Alternatives Rejected |
|----------|--------------|------------|-----------|----------------------|
| Backend type | Own Node WS server | FIRM | Live 1s market tick needs a persistent process; fully testable in-session | Supabase/Firebase — game loop fits managed realtime poorly; needs external accounts |
| Auth | Anonymous tokens (hashed at rest) | FIRM | Nothing worth stealing; zero friction; no password flows | Username+password — more attack surface, more code |
| World model | One shared world/market | FIRM | Per-player prices in a shared game feels broken | "Feed+coins only" hybrid |
| DB driver | `node:sqlite` built-in | FIRM | better-sqlite3 native build failed in sandbox; zero-dep is better practice anyway | better-sqlite3 (needs compilers/prebuilts) |
| Offline fallback | Keep full local sim when server unreachable | FIRM (Samuel implicitly approved) | Game never breaks; original features preserved | Server-required client |
| Anti-cheat (offline) | Salt in localStorage + keyed FNV hash; deterrent only, honestly labeled | FIRM | Client-side can never be truly cheat-proof; server mode is the real fix | Transmitting hashes cross-tab (griefing vector — receivers recompute instead) |
| Cooldowns/caps | trade 250ms, chirp 2s, launch 60s/user, 4KB msgs, 8 conns/IP, 3 sessions/user, 500 total, 20 registers/IP/hr | ASSUMED | Sensible defaults in `config.ts`, all env-tunable | — |
| Reserved usernames | admin/mod/system/etc blocked | ASSUMED | Anti-impersonation | — |
| Miner income online | Only while connected, server-credited | ASSUMED | Prevents idle/multi-tab farming | Client-credited mining |
| Old handle on wipe | Power-off wipe orphans the server account; name stays taken | ASSUMED (known trade-off, told Samuel) | Simplicity | Account deletion flow |

---

## 6. Dead Ends & Failed Approaches

- **better-sqlite3**: native `node-gyp` build failed in the sandbox (prebuilt download blocked).
  Replaced with `node:sqlite`. Do not go back unless Samuel's Node is < 22.5.
- **Playwright & Puppeteer browsers in the Cowork sandbox**: both download hosts
  (`cdn.playwright.dev`, `googlechromelabs.github.io`) are blocked by the network allowlist.
  Do not retry; use **jsdom + node `ws` + node `BroadcastChannel`** for browser-ish E2E (works great).
- **Transmitting integrity hashes over BroadcastChannel**: abandoned — a forged message could
  grief another tab into the cheater screen. Receivers recompute hashes locally from shared salt.
- **`npx playwright install` / detached background servers between bash calls**: the sandbox
  reaps background processes when a bash call ends (`setsid`/`nohup` don't save you). Run
  server + tests inside ONE bash call.

---

## 7. Constraints & Requirements

- Security first: server-authoritative everything; validate all input at every trust boundary
  (Samuel explicitly asked for "every vulnerability loophole covered", twice).
- Samuel is a backend novice — implement fully, explain in plain terms, no assumed knowledge.
- No real money/chain: it's a simulator. Never add real crypto rails.
- Offline single-player must keep working without the server.
- Client username rule everywhere: `/^[A-Za-z0-9_]{3,16}$/`; ticker `/^[A-Z0-9]{2,8}$/`.

*Soft preferences / style:*
- Minimal dependencies (server runs on 3 runtime deps).
- Config in one place (`server/src/config.ts`), env-overridable.
- Honest caveats appreciated — tell him what ISN'T protected, not just what is.

---

## 8. Open Questions & Blockers

- **Not yet run on Samuel's machine** — all verification happened in the sandbox.
  *Blocked on: Samuel running the two dev commands locally.*
- **Samuel's Node version unknown** — `node:sqlite` needs ≥ 22.5 (engines field wrongly says ≥20).
  *Blocked on: `node --version` output.*
- **Deployment target undecided** — Fly/Railway/Render all fine; no account info known.

---

## 9. Artifacts & Files

All paths relative to `C:\Users\samue\Desktop\Mystery project\`.

| Item | Type | Location / Description | Status |
|------|------|------------------------|--------|
| Store (persist+sync+net routing) | client module | `app/src/store/os.ts` | FINAL |
| Validators (shared trust-boundary sanitizers) | client module | `app/src/lib/validate.ts` | FINAL |
| Cross-tab sync + leader election | client module | `app/src/lib/sync.ts` | FINAL |
| WS client | client module | `app/src/lib/net.ts` | FINAL |
| Net bus (no-cycle indirection + chirp feed bus) | client module | `app/src/lib/netBus.ts` | FINAL |
| Login (username input + online register) | component | `app/src/os/Login.tsx` | FINAL |
| TopBar (handle, online badge, wipe button) | component | `app/src/os/TopBar.tsx` | FINAL |
| Chirper (online chirp/flex/larp + server feed) | component | `app/src/apps/Chirper.tsx` | FINAL |
| Boot (resume to desktop), Wallet, Desktop, App | components | `app/src/os/Boot.tsx`, `apps/Wallet.tsx`, `os/Desktop.tsx`, `App.tsx` | FINAL |
| Server gateway | server | `server/src/index.ts` | FINAL |
| Game engine | server | `server/src/engine.ts` | FINAL |
| Protocol (zod) | server | `server/src/protocol.ts` | FINAL |
| DB layer (`node:sqlite`) | server | `server/src/db.ts` | FINAL |
| Config / rules / ratelimit | server | `server/src/config.ts`, `rules.ts`, `ratelimit.ts` | FINAL |
| Server docs | doc | `server/README.md` | FINAL |
| Server package.json | config | `server/package.json` — engines needs bump to ≥22.5 | NEEDS 1-LINE FIX |
| Test suites (store/UI/E2E/persist) | tests | `/tmp/store-test.cjs`, `/tmp/ui-test.cjs`, `/tmp/e2e-test.cjs`, `/tmp/persist-test.cjs` — **sandbox-only, lost when session dies**; recreate from this doc's test descriptions if needed | EPHEMERAL |

---

## 10. Technical Context

**MODE B — Technical, non-Web3** *(crypto-themed game, but zero blockchain code)*

- **Stack:** Client: React 18.3, Zustand 4.5 (persist middleware), Vite 5, TypeScript 5.6.
  Server: Node ≥22.5, TypeScript via `tsx`, `ws` 8, `zod` 3, `node:sqlite` (built-in, WAL mode).
- **Environment:** Samuel is on Windows; app dev server port **5188**; server port **8787**.
- **Key values (verbatim):**
  - localStorage keys: `trenchos_save`, `trenchos_salt`, `trenchos_token`, `trenchos.theme`
  - BroadcastChannel name: `trenchos_sync`
  - Server env vars: `PORT` (8787), `DB_FILE` (`trenchos.sqlite`), `ALLOWED_ORIGINS`
    (default `http://localhost:5188,http://127.0.0.1:5188`), `TRUST_PROXY`
  - Client env var: `VITE_SERVER_URL` (default `ws://localhost:8787`)
  - Characters/bags (canonical, server-side): orphan 5.0, fumbler 2.0, nepo 50.0, addict 0.8;
    launch fee 1.00; miner +0.02/tick
- **Gotchas discovered (Cowork-sandbox specific — critical if next session tests there):**
  1. **Mounted Desktop-folder files go stale/truncated in the Linux sandbox after edits** —
     reads return the file cut at its *old* byte length (sometimes NUL-padded). Workaround that
     works: Write full file copies into the session **outputs** folder (syncs correctly for new
     files) and `cp` from `/sessions/<session>/mnt/outputs/` into `/tmp` for testing. The real
     Windows-side files are always correct (file tools see them fine) — only the mount lags.
  2. **Background processes are reaped between bash calls** — run server + tests in one call.
  3. **Browser binaries can't be downloaded** (allowlist) — use jsdom + `ws` + node's
     `BroadcastChannel`; inject `window.WebSocket = require('ws').WebSocket`.
  4. **Control-character regexes** (`/[ -]/`) get decoded into literal control
     bytes when written via the Write tool — patch such lines via a python heredoc afterward.
  5. `npx tsc` without local typescript grabs the wrong `tsc` package — always install locally.
  6. node `ws` client sends no Origin header → server's origin check intentionally only rejects
     *wrong* origins, not missing ones (browsers always send it; native clients hit auth anyway).
- **What NOT to do:**
  - Don't trust `verifyClient` origin checks as security — they're browser-only hygiene.
  - Don't send integrity hashes across any wire — always recompute locally.
  - Don't credit miner income client-side or per-tab (farming exploit — server/leader only).
  - Don't spread untrusted objects into state — rebuild via the sanitizers in `validate.ts`.

---

## 11. Samuel's Preferences Observed

- **Communication style:** very casual, brief messages, typos fine ("i need this maximum secureed");
  answer his literal question first ("so other users cant see...??" → "Correct — they can't").
- **Output format:** wants working code delivered and run for him, not instructions to code;
  explanations in plain language with backend concepts translated (his stated backend level: low).
- **Pace:** trusts recommendations — asked "which is better?" then accepted all defaults; asks
  repeated safety/scale follow-ups ("is it safe", "is it scaleable", "prone to any attack") — 
  answer these with specifics AND honest limits; he responds well to the honest-caveat pattern.
- **Dislikes:** unnecessary questions; being left to run/verify things himself without guidance.
- **Notable corrections:** pushed scope from tab-sync to true multiplayer after realizing
  BroadcastChannel ≠ real users — confirm scope implications early when he says "multiplayer-like".

---

## 12. Onboarding Prompt for Next Session

> You are continuing **Bull of Trench Street ($BOTS)** — a multiplayer degen-trading sim
> (React app + Node WebSocket server, NO blockchain) — with Samuel. This is handoff #1.
> Read this document fully before responding — do not ask for context already here.
>
> Samuel's immediate focus is: **running the finished multiplayer build on his own machine** —
> terminal 1: `cd server && npm install && npm run dev`; terminal 2: `cd app && npm run dev`;
> open `http://localhost:5188`. Before that, check `node --version`: the server needs
> **Node ≥ 22.5** (`node:sqlite`), and `server/package.json` engines wrongly says `>=20` —
> fix that one line.
>
> Key values needed verbatim: app port `5188`, server port `8787`, localStorage keys
> `trenchos_save` / `trenchos_salt` / `trenchos_token`, env vars `VITE_SERVER_URL`,
> `ALLOWED_ORIGINS`, `DB_FILE`.
>
> Everything is already implemented and passed 3 test suites in the sandbox (store, jsdom UI,
> multiplayer E2E incl. attack suite) — do not rebuild or redesign; only verify, fix
> environment issues, and continue with the Queued tasks (deployment, moderation tooling).
>
> Do not re-suggest Supabase/Firebase (rejected: game loop fits poorly) or better-sqlite3
> (native build failed; `node:sqlite` chosen). If testing inside the Cowork sandbox, read
> Section 10 gotcha #1 (stale mount reads) and #2 (run server+tests in one bash call) first —
> they cost this session real time.
>
> Note: cooldown values, connection caps, and reserved-username list are ASSUMED defaults
> Samuel never explicitly confirmed — fine to build on, cheap to change in `server/src/config.ts`.
>
> Begin by confirming in one sentence what you'll work on first.

---
*Handoff generated by session-handoff skill — Samuel Maji / Web3 edition v1.0*
