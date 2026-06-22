import { prisma } from "@repo/database";
import "dotenv/config";

// Timescale hypertable + continuous-aggregate views aren't expressible via
// `prisma migrate` (create_hypertable / time_bucket are Timescale extension
// functions), so this setup stays as raw SQL — run once via `npm run seed:db`.
// The resulting tables/views are typed in packages/database/prisma/schema.prisma.
async function initializeDB() {
  await prisma.$executeRawUnsafe(`
        DROP TABLE IF EXISTS "tata_prices";
        CREATE TABLE "tata_prices"(
            id              BIGSERIAL,
            time            TIMESTAMP WITH TIME ZONE NOT NULL,
            price   DOUBLE PRECISION,
            qty      NUMERIC(18,2),
            currency_code   VARCHAR (10),
            side     VARCHAR(4) CHECK (side IN ('buy', 'sell')) NOT NULL
        );

        SELECT create_hypertable('tata_prices', 'time', 'price', 2);
    `);

  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1m AS
        SELECT
            time_bucket('1 minute', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1h AS
        SELECT
            time_bucket('1 hour', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

  await prisma.$executeRawUnsafe(`
        CREATE MATERIALIZED VIEW IF NOT EXISTS klines_1w AS
        SELECT
            time_bucket('1 week', time) AS bucket,
            first(price, time) AS open,
            max(price) AS high,
            min(price) AS low,
            last(price, time) AS close,
            currency_code
        FROM tata_prices
        GROUP BY bucket, currency_code;
    `);

  await prisma.$disconnect();
  console.log("Database initialized successfully");
}

initializeDB().catch(console.error);
