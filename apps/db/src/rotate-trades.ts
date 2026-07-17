/**
 * Daily rotation — run via cron at 06:00 IST every day.
 *
 * 1. Delete all trades older than 24 hours
 * 2. Seed 1 hour of synthetic trades for today's pre-open window (05:00–06:00 IST)
 * 3. Refresh all kline materialized views
 * 4. Reset the engine (orderbooks + balances) via POST /api/v1/admin/reset
 *
 * Recommended cron (UTC, since IST = UTC+5:30):
 *   30 0 * * *   tsx /app/apps/db/src/rotate-trades.ts
 */
import prisma from "@repo/database";
import "dotenv/config";

const INTERVAL_SEC = 10;
const API_URL = process.env.API_URL ?? "http://localhost:8000";
const ADMIN_KEY = process.env.ADMIN_KEY;

async function resetEngine() {
  console.log("Resetting engine (orderbooks + balances)…");
  const res = await fetch(`${API_URL}/api/v1/admin/reset`, {
    method: "POST",
    headers: ADMIN_KEY ? { "x-admin-key": ADMIN_KEY } : {},
  });
  if (!res.ok) {
    throw new Error(`Engine reset failed: ${res.status} ${await res.text()}`);
  }
  console.log("Engine reset complete.");
}

const markets = [
  { market: "GOOGLE_INR", volatility: 8 },
  { market: "META_INR", volatility: 20 },
];

async function getLastPrice(market: string, fallback: number): Promise<number> {
  const row = await prisma.marketState
    .findUnique({ where: { market } })
    .catch(() => null);
  return row?.price ?? fallback;
}

function getWindowUTC(): { start: Date; end: Date } {
  const now = new Date();
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const todayMidnightIST = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) +
      istOffsetMs,
  );
  const windowStart = new Date(
    todayMidnightIST.getTime() - istOffsetMs + 5 * 60 * 60 * 1000,
  );
  const windowEnd = new Date(windowStart.getTime() + 60 * 60 * 1000);
  return { start: windowStart, end: windowEnd };
}

async function rotate() {
  // 1. delete trades older than 24 hours
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const { count } = await prisma.trade.deleteMany({
    where: { time: { lt: cutoff } },
  });
  console.log(`Deleted ${count} old trades`);

  const { start, end } = getWindowUTC();
  console.log(`Seeding window: ${start.toISOString()} → ${end.toISOString()}`);

  const steps = Math.floor(
    (end.getTime() - start.getTime()) / (INTERVAL_SEC * 1000),
  );

  // clear any rows already in this exact window first — otherwise a re-run (retry,
  // double cron fire, or overlap with a manual seed-trades run) leaves duplicate
  // overlapping trades in the same buckets, which skews open/close in the kline views
  const { count: windowCount } = await prisma.trade.deleteMany({
    where: {
      time: { gte: start, lt: end },
      market: { in: markets.map((m) => m.market) },
    },
  });
  if (windowCount > 0) console.log(`Cleared ${windowCount} existing rows in seed window`);

  for (const { market, volatility } of markets) {
    // continue from last known price so the chart doesn't reset
    const startPrice = await getLastPrice(
      market,
      market === "GOOGLE_INR" ? 14000 : 32000,
    );

    let price = startPrice;
    const rows: {
      time: Date;
      market: string;
      price: number;
      qty: string;
      currencyCode: string;
      side: string;
    }[] = [];

    for (let i = 0; i < steps; i++) {
      price += (Math.random() - 0.5) * volatility;
      if (price < 1) price = 1;
      rows.push({
        time: new Date(start.getTime() + i * INTERVAL_SEC * 1000),
        market,
        price,
        qty: (0.3 + Math.random() * 1.5).toFixed(2),
        currencyCode: "$",
        side: Math.random() < 0.5 ? "buy" : "sell",
      });
      if (rows.length === 500) {
        await prisma.trade.createMany({ data: rows });
        rows.length = 0;
        process.stdout.write(".");
      }
    }
    if (rows.length) await prisma.trade.createMany({ data: rows });
    console.log(
      `\n${market}: seeded from ${startPrice.toFixed(2)} → ${price.toFixed(2)}`,
    );
  }

  // 3. refresh views
  console.log("Refreshing views…");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w");

  // 4. reset engine orderbooks + balances
  await resetEngine();

  console.log("Rotation complete.");
  await prisma.$disconnect();
}

rotate().catch((err) => {
  console.error(err);
  process.exit(1);
});
