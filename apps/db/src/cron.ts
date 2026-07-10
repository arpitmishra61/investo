// View refreshes now happen inside index.ts when the DB processor goes to sleep
// (after the last user disconnects). This file is kept for manual one-off runs only.
import prisma from "@repo/database";
import "dotenv/config";

async function refreshAllViews() {
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w");
  console.log("all views refreshed");
  await prisma.$disconnect();
}

refreshAllViews().catch(console.error);
