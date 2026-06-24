import axios from "axios";
import { createClient } from "redis";
import { PrismaClient } from "@prisma/client";

const BASE_URL = process.env.API_URL ?? "http://localhost:8000";
const USER_ID = "5";

const redis = createClient({ url: process.env.REDIS_URL });
const prisma = new PrismaClient();

type MarketConfig = {
  market: string;
  defaultPrice: number;
  volatility: number;
  intervalMs: number;
};

const MARKET_CONFIGS: MarketConfig[] = [
  { market: "GOOGLE_INR", defaultPrice: 14000, volatility: 25, intervalMs: 3000 },
  { market: "META_INR",   defaultPrice: 32000, volatility: 60, intervalMs: 5000 },
];

// active interval handles keyed by market
const activeMarkets = new Map<string, ReturnType<typeof setInterval>>();
// current price per market (in-memory, synced to Redis + DB)
const prices = new Map<string, number>();
// DB price sync timers
const dbSyncTimers = new Map<string, ReturnType<typeof setInterval>>();
// pending stop timers — cancelled if mm:start arrives before they fire
const stopTimers = new Map<string, ReturnType<typeof setTimeout>>();

const STOP_DEBOUNCE_MS = 8_000; // wait 8s before actually stopping

async function loadPrice(market: string, defaultPrice: number): Promise<number> {
  // 1. try Redis (fast path)
  const cached = await redis.get(`mm:price:${market}`).catch(() => null);
  if (cached) return parseFloat(cached);

  // 2. fall back to DB
  const row = await prisma.marketState.findUnique({ where: { market } }).catch(() => null);
  if (row) return row.price;

  // 3. use hardcoded default
  return defaultPrice;
}

async function savePrice(market: string, price: number) {
  await redis.set(`mm:price:${market}`, price.toString()).catch(() => {});
}

async function savePriceToDB(market: string, price: number) {
  await prisma.marketState.upsert({
    where: { market },
    update: { price },
    create: { market, price },
  }).catch(console.error);
}

async function placeOrder(market: string, price: number, quantity: number, side: "buy" | "sell") {
  await axios.post(`${BASE_URL}/api/v1/order`, {
    market,
    price: price.toFixed(1).toString(),
    quantity: quantity.toFixed(2).toString(),
    side,
    userId: USER_ID,
  }).catch((err: any) => {
    console.log(`order failed for ${market}`, err?.response?.data ?? err.message);
  });
}

async function tick(config: MarketConfig) {
  let price = prices.get(config.market) ?? config.defaultPrice;

  price += (Math.random() - 0.5) * config.volatility;
  if (price < 1) price = 1;
  prices.set(config.market, price);

  // persist price to Redis on every tick
  await savePrice(config.market, price);

  const spread = price * 0.0015;
  const qty = 0.5 + Math.random() * 2;

  await placeOrder(config.market, price - spread - Math.random() * spread, qty, "buy");
  await placeOrder(config.market, price + spread + Math.random() * spread, qty, "sell");

  if (Math.random() < 0.6) {
    const crossSide = Math.random() < 0.5 ? "buy" : "sell";
    const crossPrice = crossSide === "buy" ? price + spread * 2 : price - spread * 2;
    await placeOrder(config.market, crossPrice, 0.3 + Math.random() * 1, crossSide);
  }

  console.log(`${config.market} tick @ ${price.toFixed(2)}`);
}

async function warmOrderbook(config: MarketConfig) {
  const price = prices.get(config.market)!;
  const spread = price * 0.0015;
  for (let i = 1; i <= 5; i++) {
    await placeOrder(config.market, price - spread * i, 1 + Math.random(), "buy");
    await placeOrder(config.market, price + spread * i, 1 + Math.random(), "sell");
  }
  console.log(`${config.market} orderbook warmed`);
}

async function startMarket(market: string) {
  // cancel any pending stop for this market
  const pending = stopTimers.get(market);
  if (pending) {
    clearTimeout(pending);
    stopTimers.delete(market);
    console.log(`${market} stop cancelled — user came back`);
  }

  if (activeMarkets.has(market)) return; // already running

  const config = MARKET_CONFIGS.find((c) => c.market === market);
  if (!config) return;

  const price = await loadPrice(market, config.defaultPrice);
  prices.set(market, price);
  console.log(`${market} starting @ ${price.toFixed(2)}`);

  await warmOrderbook(config);
  await tick(config);
  const interval = setInterval(() => tick(config), config.intervalMs);
  activeMarkets.set(market, interval);

  // sync price to DB every 60s so Redis crash only loses 60s of drift
  const dbTimer = setInterval(() => savePriceToDB(market, prices.get(market)!), 60_000);
  dbSyncTimers.set(market, dbTimer);

  // signal DB app to wake up
  await redis.publish("db:wake", market).catch(() => {});
}

async function doStopMarket(market: string) {
  stopTimers.delete(market);
  const interval = activeMarkets.get(market);
  if (!interval) return;

  clearInterval(interval);
  activeMarkets.delete(market);

  const dbTimer = dbSyncTimers.get(market);
  if (dbTimer) {
    clearInterval(dbTimer);
    dbSyncTimers.delete(market);
  }

  // final price save
  const price = prices.get(market);
  if (price) await savePriceToDB(market, price);

  console.log(`${market} stopped`);

  // if no markets running, signal DB app to sleep
  if (activeMarkets.size === 0) {
    await redis.publish("db:sleep", "all").catch(() => {});
  }
}

async function main() {
  await redis.connect();
  console.log("MM connected to Redis, waiting for start signals…");

  const sub = redis.duplicate();
  await sub.connect();

  await sub.subscribe("mm:start", async (market) => {
    console.log(`received mm:start for ${market}`);
    await startMarket(market);
  });

  await sub.subscribe("mm:stop", (market) => {
    console.log(`received mm:stop for ${market}, debouncing ${STOP_DEBOUNCE_MS}ms…`);
    if (stopTimers.has(market)) return; // already pending
    const t = setTimeout(() => doStopMarket(market), STOP_DEBOUNCE_MS);
    stopTimers.set(market, t);
  });
}

main().catch(console.error);
