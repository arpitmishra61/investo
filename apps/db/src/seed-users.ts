import prisma from "@repo/database";
import "dotenv/config";
import bcrypt from "bcryptjs";

const GUEST_USERS = [
  { name: "Alice", email: "alice@guest.investo", password: "alice123" },
  { name: "Bob", email: "bob@guest.investo", password: "bob123" },
];

async function seedUsers() {
  for (const u of GUEST_USERS) {
    const hashed = await bcrypt.hash(u.password, 10);
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: { name: u.name, email: u.email, password: hashed },
    });
    console.log(`✓ ${u.name} (${u.email})`);
  }
  await prisma.$disconnect();
  console.log("Guest users seeded.");
}

seedUsers().catch(console.error);
