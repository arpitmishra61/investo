import prisma from "@repo/database";
import "dotenv/config";

// The "trades" table itself is managed by `prisma migrate` (see packages/database/prisma).
// Only the Timescale-specific parts stay here as raw SQL, since they're extension
// functions `prisma migrate` cannot express: converting "trades" into a hypertable,
// and creating the `time_bucket`-based continuous-aggregate views. Safe to re-run.
async function initializeDB() {
  await prisma.$executeRawUnsafe(`
    CREATE EXTENSION IF NOT EXISTS timescaledb;
  `);
  await prisma.$executeRawUnsafe(`
    SELECT create_hypertable('trades', 'time', 'market', 2, if_not_exists => TRUE);
  `);
  // open/close must be ordered by `time`, not `id` — insertion order (id) only
  // matches chronological order (time) as long as rows are never re-seeded into an
  // already-populated window; ordering by time is correct regardless, so a stray
  // duplicate/overlapping seed run can't skew OHLC into a wall of uniform candles.
  // DROP + CREATE (not IF NOT EXISTS) so re-running this after the fix actually
  // replaces any already-created views with the corrected id-based definition.
  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS klines_1m;`);
  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            market,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM trades
        GROUP BY bucket, market, currency_code;
    `);

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS klines_1h;`);
  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            market,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM trades
        GROUP BY bucket, market, currency_code;
    `);

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS klines_1w;`);
  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            market,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM trades
        GROUP BY bucket, market, currency_code;
    `);

  await prisma.$executeRawUnsafe(`DROP MATERIALIZED VIEW IF EXISTS klines_3s;`);
  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW klines_3s AS
        SELECT
            time_bucket('10 seconds', time) AS bucket,
            market,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM trades
        GROUP BY bucket, market, currency_code;
    `);

  console.log("Refreshing views…");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w");

  await prisma.$disconnect();
  console.log("Database initialized successfully");
}

initializeDB().catch(console.error);
