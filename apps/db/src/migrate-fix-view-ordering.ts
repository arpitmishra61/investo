/**
 * One-time migration for existing deployments.
 *
 * The klines_* materialized views originally used `first(price, time)` /
 * `last(price, time)` to pick each bucket's open/close price. When a single
 * order sweeps multiple resting orders in one match, every resulting fill
 * shares the same taker timestamp — so `time` has ties, and first()/last()
 * resolve them arbitrarily, occasionally picking the wrong open/close price.
 *
 * `id` (BigInt autoincrement) preserves true fill order with no ties, so we
 * drop and recreate the views using `id` instead. `CREATE MATERIALIZED VIEW
 * IF NOT EXISTS` in seed-db.ts is a no-op on a DB that already has these
 * views, which is why this migration exists as a separate one-off script.
 *
 * Usage: cd apps/db && npx tsx src/migrate-fix-view-ordering.ts
 */
import prisma from "@repo/database";
import "dotenv/config";

const VIEWS: { name: string; bucket: string }[] = [
  { name: "klines_1m", bucket: "1 minute" },
  { name: "klines_1h", bucket: "1 hour" },
  { name: "klines_1w", bucket: "1 week" },
  { name: "klines_3s", bucket: "10 seconds" },
];

async function migrate() {
  for (const { name, bucket } of VIEWS) {
    console.log(`Dropping ${name}...`);
    await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS ${name};`);

    console.log(`Recreating ${name}...`);
    await prisma.$executeRawUnsafe(`
      CREATE MATERIALIZED VIEW ${name} AS
      SELECT
          time_bucket('${bucket}', time) AS bucket,
          market,
          first(price, id) AS open,
          max(price) AS high,
          min(price) AS low,
          last(price, id) AS close,
          currency_code
      FROM trades
      GROUP BY bucket, market, currency_code;
    `);
  }

  console.log("Migration complete: klines_* views now order open/close by id, not time.");
  await prisma.$disconnect();
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
