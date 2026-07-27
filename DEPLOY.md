# Deploying Investo

**Split:** `dashboard` → Vercel · everything else (api, engine, ws, mm, db, Redis, TimescaleDB, cron) → one Oracle Cloud **Ampere A1** instance via Docker Compose. Caddy (TLS reverse proxy) runs as its own standalone container on the same instance, outside this compose stack.

---

## 1. Provision the Oracle instance

- Shape: **VM.Standard.A1.Flex** (Always Free — up to 4 OCPU / 24 GB RAM), Ubuntu 22.04.
- Install Docker + Compose plugin:
  ```sh
  curl -fsSL https://get.docker.com | sh
  sudo usermod -aG docker $USER   # re-login after this
  ```

### Open the ports (two layers — both are required)

1. **VCN Security List / NSG** (Oracle console): allow ingress TCP **80** and **443** from `0.0.0.0/0`.
2. **Instance firewall** (Ubuntu images block by default):
   ```sh
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 80 -j ACCEPT
   sudo iptables -I INPUT 6 -m state --state NEW -p tcp --dport 443 -j ACCEPT
   sudo netfilter-persistent save
   ```
   Only 80/443 need to be public — 8000/5001 are reached through the standalone Caddy container, and Redis/Postgres stay on the internal network.

---

## 2. Configure

```sh
git clone <your-repo> investo && cd investo
cp .env.example .env
# edit .env: set a strong POSTGRES_PASSWORD (and the same in DATABASE_URL)
```

Point DNS **A records** for `api.<domain>` and `ws.<domain>` at the instance's public IP.

The standalone Caddy container (managed separately from this compose stack) should reverse-proxy `api.<domain>` → `localhost:8000` and `ws.<domain>` → `localhost:5001` on the instance.

---

## 3. First-time database bootstrap

Bring up just the datastores, then run migrations + seeds once:

```sh
docker compose up -d redis timescaledb

# apply the Prisma schema (run inside a throwaway app container)
docker compose run --rm db sh -c "cd /app/packages/database && npx prisma migrate deploy"

# create the hypertable + materialized views, then seed users/trades
docker compose run --rm db npm run seed:db
docker compose run --rm db npm run seed:users
docker compose run --rm db npm run seed:trades
```

> If `prisma migrate deploy` reports no migrations, use `npx prisma db push` instead.

---

## 4. Launch everything

```sh
docker compose up -d --build
docker compose ps
docker compose logs -f engine api ws
```

Verify TLS is live: `curl https://api.<domain>/` should respond (the standalone Caddy container issues certs on first request — give it a few seconds).

---

## 5. Point Vercel at the box

Deploy `apps/dashboard` on Vercel with **Root Directory = `apps/dashboard`**, and set env vars:

```
NEXT_PUBLIC_API_URL = https://api.<domain>
NEXT_PUBLIC_WS_URL  = wss://ws.<domain>
```

> Confirm the actual env var names the dashboard reads (grep `NEXT_PUBLIC_` in `apps/dashboard`) and make sure the API's CORS `origin` allows your Vercel domain — see `apps/api/src/index.ts`.

---

## Cron

`rotate-trades.ts` runs daily at **00:30 UTC (06:00 IST)** via the `cron` (Ofelia) container, which `docker exec`s into `db`. Adjust the schedule on the `db` service's `ofelia.job-exec.rotate-trades.schedule` label in `docker-compose.yml`. Run it manually any time:

```sh
docker compose exec db sh -c "cd /app/apps/db && tsx src/rotate-trades.ts"
```

## Updating

```sh
git pull && docker compose up -d --build
```

The engine restores its in-memory orderbook from the persisted `snapshot.json` (kept in the `engine-snapshot` volume) on restart.
