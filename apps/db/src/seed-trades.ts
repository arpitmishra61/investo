import { PrismaClient } from "@prisma/client";
import "dotenv/config";

const prisma = new PrismaClient();

// IST is UTC+5:30. Market "pre-open" window: 05:00–06:00 IST = 23:30–00:30 UTC (prev day)
const INTERVAL_SEC = 10; // one trade every 10 seconds → 360 rows/market for 1hr

const markets = [
  { market: "GOOGLE_INR", startPrice: 14000, volatility: 8 },
  { market: "META_INR",   startPrice: 32000, volatility: 20 },
];

function getWindowUTC(): { start: Date; end: Date } {
  const now = new Date();

  // today 05:00 IST in UTC = today 23:30 UTC previous calendar day
  const istOffsetMs = 5.5 * 60 * 60 * 1000;
  const todayMidnightIST = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) + istOffsetMs,
  );
  // 05:00 IST = midnight IST + 5h
  const windowStart = new Date(todayMidnightIST.getTime() - istOffsetMs + 5 * 60 * 60 * 1000);
  const windowEnd   = new Date(windowStart.getTime() + 60 * 60 * 1000); // +1 hour
  return { start: windowStart, end: windowEnd };
}

async function seedTrades() {
  const { start, end } = getWindowUTC();
  console.log(`Seeding window: ${start.toISOString()} → ${end.toISOString()}`);

  const steps = Math.floor((end.getTime() - start.getTime()) / (INTERVAL_SEC * 1000));

  for (const { market, startPrice, volatility } of markets) {
    const { count } = await prisma.trade.deleteMany({ where: { market } });
    if (count > 0) console.log(`${market}: deleted ${count} old trades`);

    console.log(`Seeding ${steps} trades for ${market}…`);
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

    console.log(`\n${market}: done (final price ${price.toFixed(2)})`);
  }

  console.log("Refreshing kline views…");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w");

  console.log("Seed complete.");
  await prisma.$disconnect();
}

seedTrades().catch((err) => {
  console.error(err);
  process.exit(1);
});
