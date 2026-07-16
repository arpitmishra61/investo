# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Investo** is a simulated stock trading platform built as a Turborepo monorepo. It features a real-time matching engine, WebSocket server, market maker, and a Next.js dashboard. All currency is INR and three markets are supported: `TATA_INR`, `GOOGLE_INR`, `META_INR`.

## Apps and Packages

| Name | Path | Port | Description |
|---|---|---|---|
| `api` | `apps/api` | 8000 | Express REST API, proxies requests to engine via Redis |
| `engine` | `apps/engine` | — | In-memory matching engine, polls Redis queue `messages` |
| `ws` | `apps/ws` | 5001 | WebSocket server, bridges Redis pub/sub to browser clients |
| `mm` | `apps/mm` | — | Market maker; places automatic buy/sell orders, controlled by Redis channels |
| `db` | `apps/db` | — | Database writer; batches trades to TimescaleDB via Prisma |
| `dashboard` | `apps/dashboard` | 3000 | Next.js 16 frontend |
| `@repo/database` | `packages/database` | — | Prisma client + schema |
| `@repo/types` | `packages/types` | — | Shared TypeScript types (depth, trade, ticker) |

## Commands

### Run all services (development)
```sh
npx turbo dev
```

### Run a single app
```sh
npx turbo dev --filter=dashboard
npx turbo dev --filter=engine
npx turbo dev --filter=ws
npx turbo dev --filter=api
npx turbo dev --filter=mm
npx turbo dev --filter=db
```

### Build
```sh
npx turbo build
```

### Lint (dashboard)
```sh
cd apps/dashboard && npm run lint
cd apps/dashboard && npm run check-types
```

### Tests (engine)
```sh
cd apps/engine && npm run test   # vitest
```

### Database
```sh
# Run migrations
cd packages/database && npx prisma migrate dev

# Generate Prisma client
cd packages/database && npx prisma generate

# Seed DB (creates hypertable, materialized views)
cd apps/db && npm run seed:db

# Seed historical trades
cd apps/db && npm run seed:trades
```

## Architecture: Request & Data Flow

### Order Placement
1. Dashboard (`POST /api/v1/order`) → **API** (Express, port 8000)
2. API pushes a JSON message onto Redis list `messages` (key: `messages`) and creates a blocking promise keyed by `clientId`
3. **Engine** polls `messages` via `rPop` in a tight loop, runs the matching logic in `Engine.process()`
4. Engine sends response back to API via Redis pub/sub on channel `<clientId>`, and publishes depth/trade updates on channels `depth@<market>` and `trade@<market>`
5. API resolves the pending promise and returns the HTTP response

### Real-time Updates (WebSocket)
- Clients connect to **ws** (port 5001) and send subscription messages (e.g. `SUBSCRIBE depth@TATA_INR`)
- `SubscriptionManager` subscribes to the corresponding Redis pub/sub channel
- When the engine publishes a depth/trade/balance/current_price update, it reaches every subscribed browser client immediately

### Market Maker Lifecycle
- MM listens on Redis channels `mm:start` and `mm:stop` (with 8s debounce) and `mm:stop:force` (immediate)
- **Topbar** component sends start/stop signals via `SignalingManager` → WebSocket → `SubscriptionManager` → Redis pub/sub
- MM persists the current price to Redis (`mm:price:<market>`) every tick and to PostgreSQL every 60s
- On start, MM loads price from Redis → DB → hardcoded default

### DB Writer
- Engine pushes `TRADE_ADDED` messages onto Redis list `db_processor`
- **db** polls `db_processor`, batches rows, and flushes to PostgreSQL every 10s or when batch hits 20 rows
- After flush it refreshes materialized views (`klines_3s`, `klines_1m`, etc.)
- DB wakes/sleeps via Redis channels `db:wake` / `db:sleep` to avoid idle Neon compute

## API Rate Limiting

- Middleware lives in `apps/api/src/middleware/rateLimit.ts` (uses `express-rate-limit`, in-memory store, fixed 60s window, per-IP).
- Three tiers, applied per-router in `apps/api/src/index.ts`:
  - `strictRateLimit` (10 req/min) — `/api/v1/auth`, `/api/v1/admin`
  - `orderRateLimit` (30 req/min) — `/api/v1/order`
  - `readRateLimit` (120 req/min) — `/api/v1/depth`, `/api/v1/trades`, `/api/v1/klines`, `/api/v1/tickers`, `/api/v1/balance`
- This is app-layer protection only (per-IP counters, in-process). It stops a single abusive client (e.g. Postman/for-loop spam) but does **not** protect against distributed or volumetric/network-layer DDoS — that requires an edge layer (Cloudflare, etc.) in front of Caddy, since raw network floods never reach Express's middleware chain.
- `ADMIN_KEY` is set to `reset-orderbook-1111` in `apps/api/.env` and `apps/db/.env` (dev) and must be set in the top-level `.env` for docker-compose prod (see `.env.example`) — the `x-admin-key` check in `admin.ts` only enforces when this is set.

### Daily Rotation → Engine Reset
- `apps/db/src/rotate-trades.ts` (run by the `rotate-trades` Ofelia cron job, daily at 00:30 UTC / 06:00 IST) now has a **4th step**: after refreshing kline views, it calls `POST /api/v1/admin/reset` (via `resetEngine()`, using `API_URL` + `ADMIN_KEY` from `apps/db/.env`) to wipe engine orderbooks and reset all balances back to seeded defaults.
- This means trading state (open orders, balances) resets to defaults every 24h, in addition to the trade-history rotation. Intentional for a demo/dummy app — reconsider before enabling in a real-money context.
- If `rotate-trades.ts` is ever run manually (`npm run rotate` in `apps/db`) it will also trigger this reset — not just clean up trade history.

## Dashboard Routes

| Route | Description |
|---|---|
| `/` | Landing/hero page |
| `/markets` | Market list table with 24h stats |
| `/market/[symbol]` | Trading page for a single market (`tata`, `google`, `meta`) |
| `/orders` | Open orders view |

There is **no** `/dashboard` route. The old `/dashboard/[...slug]` was removed; the trading page is now `/market/[symbol]`.

## Dashboard UI Architecture

- **Theme**: `next-themes` with `defaultTheme="dark"`, togglable on every page. Provider is in `app/providers.tsx`, wrapped in `app/layout.tsx`.
- **Theme toggle**: `app/components/ThemeToggle.tsx` — renders Sun/Moon icon, uses `useTheme()`. Present in nav of every page.
- **CSS variables**: All component colors use Tailwind CSS variable-based classes (`bg-background`, `text-foreground`, `bg-muted`, `border-border`, etc.) so they respond to the theme class on `<html>`. Never use hardcoded `bg-white`, `bg-zinc-*`, or `text-zinc-*` — use the CSS variable equivalents.
- **Chart theming**: `PriceChart` uses `resolvedTheme` from `useTheme()` as a `useEffect` dependency to re-create the lightweight-charts instance with dark/light colors when theme changes.

### Key Components

| Component | Path | Notes |
|---|---|---|
| `MarketNav` | `app/components/MarketNav.tsx` | Nav bar for `/market/[symbol]` — client component, contains ThemeToggle |
| `TopBar` | `app/components/Topbar.tsx` | Ticker stats + Start/Stop trade button for a market |
| `PriceChart` | `app/components/chart/priceChart.tsx` | Candlestick chart via `lightweight-charts`, polls klines every 2s |
| `OrderBook` | `app/components/orderBook.tsx` | Live depth + trades, updated via WebSocket |
| `TradingOrderForm` | `app/components/TradeBox.tsx` | Buy/Sell form, subscribes to live balance via WebSocket |
| `TradeSessionGuard` | `app/components/TradeSessionGuard.tsx` | Manages MM start/stop lifecycle on mount/unmount |
| `MarketLoader` | `app/components/MarketLoader.tsx` | Initialises WebSocket connection for a market |

## Key Design Decisions

- **Engine state is in-memory + snapshot**: The engine snapshots orderbooks and balances to `snapshot.json` every 3 seconds, at `path.join(process.env.SNAPSHOT_DIR || ".", "snapshot.json")` — `apps/engine/snapshot.json` in local dev, `/data/snapshot/snapshot.json` (a dedicated Docker volume) in prod. On restart with `WITH_SNAPSHOT=true`, it restores state from that file.
- **No floats in production**: There is a TODO in `Engine.ts` to replace float arithmetic with a decimal library — the engine currently uses `number` throughout.
- **Balances pre-seeded**: Users `"1"`, `"2"`, and `"5"` (the MM user) are seeded with 10M INR and 10M of each stock at engine startup. The dashboard hardcodes `userId: "5"` for all orders and balance queries.
- **TimescaleDB klines**: The `trades` table is a Timescale hypertable. OHLC candles are served from materialized views (`klines_3s`, `klines_1m`, `klines_1h`, `klines_1w`) refreshed by the db app.
- **MM `.env`**: `apps/mm` requires a `.env` file with `DATABASE_URL` and loads it via `import "dotenv/config"` at the top of `src/index.ts`. The `apps/db` app does the same.

## Deployment Gotchas

### `engine-snapshot` volume shadows the engine's source code
- `docker-compose.yml`'s `engine` service mounts a **named volume over the whole source directory**: `engine-snapshot:/app/apps/engine` (intended only for persisting `snapshot.json`).
- Named volumes are only seeded from the image **once** — the first time a container mounts an empty named volume onto a directory, Docker copies the image's contents in. Every subsequent container recreation reuses that frozen volume content instead of the new image's files.
- **Symptom**: you push a commit, CI/CD runs `git pull && docker compose up -d --build`, the image rebuilds successfully (confirmed via `docker run --rm investo-backend:latest grep ...`), but the actual running `investo-engine` container still executes old code (confirmed via `docker exec investo-engine grep ...` returning nothing for code that should be there). Restarting/recreating the container alone does **not** fix it — the stale volume just gets remounted again.
- **Fix that actually resolves it**: the volume itself must be deleted so Docker reseeds it from the fresh image:
  ```sh
  docker compose stop engine
  docker compose rm -f engine   # `stop` alone leaves the container attached to the volume ("volume is in use")
  docker volume rm investo_engine-snapshot   # check exact name via `docker volume ls`
  docker compose up -d engine
  ```
- **Fixed**: the volume now mounts at `engine-snapshot:/data/snapshot` (set via `SNAPSHOT_DIR=/data/snapshot` in `docker-compose.yml`), which no longer overlaps with `/app/apps/engine`. `Engine.ts` reads/writes `path.join(process.env.SNAPSHOT_DIR || ".", "snapshot.json")`, so local dev (no `SNAPSHOT_DIR` set) still uses `apps/engine/snapshot.json` as before.
- Always sanity-check a suspected "code isn't updating" deploy issue in this order: (1) is the commit actually pushed/on the VM's checkout (`git log --oneline -1` on the VM vs. local), (2) does the **image** have the code (`docker run --rm investo-backend:latest grep ...`), (3) does the **running container** have the code (`docker exec <container> grep ...`) — a mismatch between steps 2 and 3 means a volume (or bind mount) is shadowing the directory, not a build/git problem.

## Environment Variables

- `DATABASE_URL` — PostgreSQL/TimescaleDB connection string (used by `@repo/database`, `apps/db`, and `apps/mm`)
- `REDIS_URL` — Redis connection string (used by `apps/db` and `apps/mm`; others use default `localhost:6379`)
- `WITH_SNAPSHOT=true` — Engine flag to restore state from `snapshot.json` on startup
- `SNAPSHOT_DIR` — directory for the engine's `snapshot.json` (default: `.`, i.e. `apps/engine/snapshot.json`). Set to `/data/snapshot` in `docker-compose.yml`, backed by the `engine-snapshot` volume, so the volume never overlaps with the source directory
- `API_URL` — Base URL for the REST API used by the MM (default: `http://localhost:8000`)
- `PORT` — API server port (default: `8000`)
- `ADMIN_KEY` — expected value of the `x-admin-key` header for `POST /api/v1/admin/reset`. **Currently unset in `apps/api/.env`**, which disables the auth check entirely (see API Rate Limiting section above).
