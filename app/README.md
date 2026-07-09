# Bull of Trench Street — $BOTS

A Solana degen come-up simulator, built as a fake desktop OS. Pick your character,
trade coins or mint your own memes, farm clout by flexing real PnL — or larping it.

**Play-money by design.** In-game currency (BOTS) never cashes out; the real `$BOTS`
token lives outside the game as a separate hype coin. See `src/config/world.ts`.

## Run it

```bash
npm install
npm run dev      # http://localhost:5188
npm run build    # type-check + production build to dist/
```

## Stack

- **React 18 + TypeScript + Vite** — the OS shell and apps
- **Zustand** — window-manager + game state (`src/store/os.ts`)
- Plain CSS with a matte-blue design-token system (`src/styles/global.css`)
- Canvas sparklines, WebAudio sound fx — no external assets (CSP-safe)

## Structure

```
src/
  config/world.ts     # BRANDING — rename the whole game here
  store/os.ts         # OS state: windows, focus, balance, coins, toasts, overview
  os/                 # shell: Boot, Login, Desktop, TopBar, Dock, Window, Wallpaper, AppGrid
  apps/               # DegenFun, Chirper, Wallet, Terminal, icons, registry (coins/posts/chars)
  lib/                # market sim, sound, dom helpers
```

## What works today

Boot → character-select login → animated desktop. Draggable / resizable / snapping
windows (pointer + rAF, no re-render jank), GNOME-style Overview, magnifying dock with
minimize-to-dock, app grid, live market tick, Degen.Fun two-pane terminal, Chirper feed
with flex/larp, a real Terminal (`neofetch`, `buy`, `larp`, …), sound, mobile fullscreen mode.

## Next (server phase)

The market/wallet are client-side sim today. Per the architecture plan, the next milestone
is a server-authoritative wallet + one bonding-curve trade (Fastify + Postgres + a tick worker),
so balances and PnL can't be forged. See the `TRENCH_OS-*.html` design docs one level up.
