import prisma from "@repo/database";
import "dotenv/config";

// The "trades" table itself is managed by `prisma migrate` (see packages/database/prisma).
// Only the Timescale-specific parts stay here as raw SQL, since they're extension
// functions `prisma migrate` cannot express: converting "trades" into a hypertable,
// and creating the `time_bucket`-based continuous-aggregate views. Safe to re-run.
async function initializeDB() {
  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
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

  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
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

  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
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

  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_3s AS
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

  await prisma.$disconnect();
  console.log("Database initialized successfully");
}

initializeDB().catch(console.error);
