import { createClient } from "redis";
import prisma from "@repo/database";
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

type FillRow = {
  time: Date;
  market: string;
  price: number;
  qty: string;
  side: string;
  userId: bigint;
  tradeId: bigint;
};

let batch: TradeRow[] = [];
let fillBatch: FillRow[] = [];
let flushTimer: ReturnType<typeof setInterval> | null = null;
let polling = false;

async function closePrisma() {
  if (prisma) {
    await prisma.$disconnect();
    console.log("Neon connection closed");
  }
}

async function flush() {
  if (batch.length === 0 && fillBatch.length === 0) return;
  const rows = batch.splice(0);
  const fillRows = fillBatch.splice(0);
  if (rows.length) {
    await prisma.trade.createMany({ data: rows }).catch((e) => console.error("[db] trade flush error:", e?.message ?? e));
  }
  if (fillRows.length) {
    await prisma.fill.createMany({ data: fillRows }).catch((e) => console.error("[db] fill flush error:", e?.message ?? e));
  }
  console.log(`flushed ${rows.length} trades, ${fillRows.length} fills`);
}

async function refreshViews() {
  const p = prisma;
  await p
    .$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s")
    .catch(console.error);
  await p
    .$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m")
    .catch(console.error);
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
      const {
        id,
        price,
        quantity,
        timestamp,
        isBuyerMaker,
        market,
        takerUserId,
        makerUserId,
        takerSide,
      } = res.data;
      const time = new Date(timestamp);
      const priceNum = parseFloat(price);

      // public tape: one row per match (feeds klines)
      batch.push({
        time,
        market,
        price: priceNum,
        qty: quantity,
        currencyCode: "$",
        side: isBuyerMaker ? "buy" : "sell",
      });

      // per-user ledger: one row per participant (taker + maker)
      const makerSide = takerSide === "buy" ? "sell" : "buy";
      fillBatch.push(
        {
          time,
          market,
          price: priceNum,
          qty: quantity,
          side: takerSide,
          userId: BigInt(takerUserId),
          tradeId: BigInt(id),
        },
        {
          time,
          market,
          price: priceNum,
          qty: quantity,
          side: makerSide,
          userId: BigInt(makerUserId),
          tradeId: BigInt(id),
        },
      );

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
  await prisma
    .$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s")
    .catch(console.error);
  await prisma
    .$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m")
    .catch(console.error);
  await prisma
    .$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h")
    .catch(console.error);
  await prisma
    .$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w")
    .catch(console.error);
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
