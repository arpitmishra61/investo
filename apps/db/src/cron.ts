import { prisma } from "@repo/database";
import "dotenv/config";

async function refreshSlowViews() {
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1m");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1h");
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_1w");
  console.log("Slow views refreshed");
}

async function refreshFastViews() {
  await prisma.$executeRawUnsafe("REFRESH MATERIALIZED VIEW klines_3s");
}

refreshSlowViews().catch(console.error);
refreshFastViews().catch(console.error);

setInterval(() => { refreshSlowViews().catch(console.error); }, 1000 * 5);
setInterval(() => { refreshFastViews().catch(console.error); }, 2000);
