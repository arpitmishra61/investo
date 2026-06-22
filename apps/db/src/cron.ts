import { prisma } from "@repo/database";
import "dotenv/config";

async function refreshViews() {
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w");

  console.log("Materialized views refreshed successfully");
}

refreshViews().catch(console.error);

setInterval(() => {
  refreshViews();
}, 1000 * 5);
