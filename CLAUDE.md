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
- **Topbar** component sends `MM_START` / `MM_STOP` / `MM_STOP_FORCE` messages via WebSocket, which are forwarded by `SubscriptionManager` as Redis pub/sub
- MM persists the current price to Redis (`mm:price:<market>`) every tick and to PostgreSQL every 60s
- On start, MM loads price from Redis → DB → hardcoded default

### DB Writer
- Engine pushes `TRADE_ADDED` messages onto Redis list `db_processor`
- **db** polls `db_processor`, batches rows, and flushes to PostgreSQL every 10s or when batch hits 20 rows
- After flush it refreshes materialized views (`klines_3s`, `klines_1m`, etc.)
- DB wakes/sleeps via Redis channels `db:wake` / `db:sleep` to avoid idle Neon compute

## Key Design Decisions

- **Engine state is in-memory + snapshot**: The engine snapshots orderbooks and balances to `apps/engine/snapshot.json` every 3 seconds. On restart with `WITH_SNAPSHOT=true`, it restores state from that file.
- **No floats in production**: There is a TODO in `Engine.ts` to replace float arithmetic with a decimal library — the engine currently uses `number` throughout.
- **Balances pre-seeded**: Users `"1"`, `"2"`, and `"5"` (the MM user) are seeded with 10M INR and 10M of each stock at engine startup.
- **TimescaleDB klines**: The `trades` table is a Timescale hypertable. OHLC candles are served from materialized views (`klines_3s`, `klines_1m`, `klines_1h`, `klines_1w`) refreshed by the db app.
- **Market routes**: Dashboard routes are `/dashboard/[symbol]` where symbol is `tata`, `google`, or `meta`. The `TradeSessionGuard` component manages the MM start/stop lifecycle on mount/unmount.

## Environment Variables

- `DATABASE_URL` — PostgreSQL/TimescaleDB connection string (used by `@repo/database` and `apps/db`)
- `REDIS_URL` — Redis connection string (used by `apps/db` and `apps/mm`; others use default `localhost:6379`)
- `WITH_SNAPSHOT=true` — Engine flag to restore state from `snapshot.json` on startup
- `API_URL` — Base URL for the REST API used by the MM (default: `http://localhost:8000`)
- `PORT` — API server port (default: `8000`)
