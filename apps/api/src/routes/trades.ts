import { Router } from "express";
import { prisma } from "@repo/database";
import "dotenv/config";

export const tradesRouter = Router();

tradesRouter.get("/", async (req, res) => {
  const { market } = req.query;
  console.log(market);
  try {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const rows = await prisma.trade.findMany({
      where: { market: market as string, time: { gte: startOfDay, lte: endOfDay } },
      take: 10,
    });
    const trades = rows.map((row) => ({
      id: Number(row.id),
      side: row.side as "buy" | "sell",
      price: String(row.price),
      qty: row.qty?.toString(),
      time: row.time.getTime(),
    }));
    console.log("result", trades);
    res.json({ trades });
  } catch (err) {
    console.log("err", err);
  }
});
