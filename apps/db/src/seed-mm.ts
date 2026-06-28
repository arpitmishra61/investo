import prisma from "@repo/database";
import "dotenv/config";
import bcrypt from "bcryptjs";

// The market maker is a real User row (id = 3) so that fills/trades can carry a
// valid foreign key. Engine + dashboard hardcode userId "3" for the MM account.
const MM_ID = 3n;

async function seedMarketMaker() {
  const hashed = await bcrypt.hash("marketmaker123", 10);

  // Upsert the MM user at a fixed id.
  await prisma.user.upsert({
    where: { id: MM_ID },
    update: { type: "MARKET_MAKER" },
    create: {
      id: MM_ID,
      name: "Market Maker",
      email: "mm@investo.local",
      password: hashed,
      type: "MARKET_MAKER",
    },
  });
  console.log(`✓ market maker user (id ${MM_ID})`);

  // A manually-inserted id doesn't advance the BIGSERIAL sequence, so bump it
  // past existing ids to stop future signups colliding with id 3.
  await prisma.$executeRawUnsafe(
    `SELECT setval(pg_get_serial_sequence('"User"', 'id'), GREATEST((SELECT COALESCE(MAX(id), 1) FROM "User"), 3))`,
  );

  // Backfill historical trades that were written before user_id was tracked.
  const result = await prisma.$executeRawUnsafe(
    `UPDATE trades SET user_id = ${MM_ID} WHERE user_id IS NULL`,
  );
  console.log(`✓ backfilled ${result} trades to user ${MM_ID}`);

  await prisma.$disconnect();
  console.log("Market maker seed complete.");
}

seedMarketMaker().catch((err) => {
  console.error(err);
  process.exit(1);
});
