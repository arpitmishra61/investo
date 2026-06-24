import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";
import { DbMessage } from "./types";
import "dotenv/config";

const BATCH_SIZE = 20;
const FLUSH_INTERVAL_MS = 10_000;

type TradeRow = {
  time: Date;
  market: string;
  price: number;
  qty: string;
  currencyCode: string;
  side: string;
};

let batch: TradeRow[] = [];
let prisma: PrismaClient | null = null;
let flushTimer: ReturnType<typeof setInterval> | null = null;
let polling = false;

function getPrisma(): PrismaClient {
  if (!prisma) {
    prisma = new PrismaClient();
    console.log("Neon connection opened");
  }
  return prisma;
}

async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
    prisma = null;
    console.log("Neon connection closed");
  }
}

async function flush() {
  if (batch.length === 0) return;
  const rows = batch.splice(0);
  await getPrisma().trade.createMany({ data: rows }).catch(console.error);
  console.log(`flushed ${rows.length} trades`);
}

async function refreshViews() {
  const p = getPrisma();
  await p.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s").catch(console.error);
  await p.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m").catch(console.error);
}

function startFlushing() {
  if (flushTimer) return;
  flushTimer = setInterval(async () => {
    await flush();
    await refreshViews();
  }, FLUSH_INTERVAL_MS);
}

function stopFlushing() {
  if (flushTimer) {
    clearInterval(flushTimer);
    flushTimer = null;
  }
}

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function pollTrades(redisClient: ReturnType<typeof createClient>) {
  if (polling) return;
  polling = true;
  startFlushing();

  console.log("DB processor awake, polling trades…");

  while (polling) {
    const response = await redisClient.rPop("db_processor").catch(() => null);

    if (!response) {
      await sleep(500);
      continue;
    }

    const res: DbMessage = JSON.parse(response);
    if (res.type === "TRADE_ADDED") {
      const { price, quantity, timestamp, isBuyerMaker, market } = res.data;
      batch.push({
        time: new Date(timestamp),
        market,
        price: parseFloat(price),
        qty: quantity,
        currencyCode: "$",
        side: isBuyerMaker ? "buy" : "sell",
      });

      if (batch.length >= BATCH_SIZE) await flush();
    }
  }
}

async function goToSleep() {
  if (!polling) return;
  polling = false;
  stopFlushing();

  // drain whatever is left before closing connection
  await flush();

  // final view refresh so klines are up to date before going idle
  await getPrisma().$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s").catch(console.error);
  await getPrisma().$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m").catch(console.error);
  await getPrisma().$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h").catch(console.error);
  await getPrisma().$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w").catch(console.error);
  console.log("views refreshed");

  await closePrisma();
  console.log("DB processor sleeping — Neon compute released");
}

async function main() {
  const redis = createClient({ url: process.env.REDIS_URL });
  await redis.connect();
  console.log("DB processor connected to Redis, waiting for wake signal…");

  const sub = redis.duplicate();
  await sub.connect();

  await sub.subscribe("db:wake", () => pollTrades(redis));
  await sub.subscribe("db:sleep", () => goToSleep());
}

main().catch(console.error);
