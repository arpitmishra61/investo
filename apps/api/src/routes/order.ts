import { Router } from "express";
import prisma from "@repo/database";
import { RedisManager } from "../RedisManager";
import {
  CREATE_ORDER,
  CANCEL_ORDER,
  ON_RAMP,
  GET_OPEN_ORDERS,
} from "../types/index";

export const orderRouter = Router();

// Top 10 most recent executed orders (trades) for a given user
orderRouter.get("/executed_orders", async (req, res) => {
  const { userId } = req.query;
  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }
  try {
    const rows = await prisma.fill.findMany({
      where: { userId: BigInt(userId as string) },
      orderBy: { time: "desc" },
      take: 10,
    });
    const orders = rows.map((row) => ({
      id: Number(row.id),
      time: row.time.getTime(),
      market: row.market,
      price: String(row.price),
      qty: row.qty.toString(),
      side: row.side as "buy" | "sell",
    }));
    res.json({ orders });
  } catch (err) {
    console.log("err", err);
    res.status(500).json({ error: "failed to fetch executed orders" });
  }
});

orderRouter.post("/", async (req, res) => {
  const { market, price, quantity, side, userId } = req.body;
  console.log({ market, price, quantity, side, userId });
  //TODO: can u make the type of the response object right? Right now it is a union.
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CREATE_ORDER,
    data: {
      market,
      price,
      quantity,
      side,
      userId,
      timeStamp : Date.now()
    },
  });
  console.log("Fdxzgsedg", response)
  res.json(response.payload);
});

orderRouter.delete("/", async (req, res) => {
  const { orderId, market } = req.body;
  const response = await RedisManager.getInstance().sendAndAwait({
    type: CANCEL_ORDER,
    data: {
      orderId,
      market,
    },
  });
  res.json(response.payload);
});
console.log(GET_OPEN_ORDERS);
orderRouter.get("/open", async (req, res) => {
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_OPEN_ORDERS,
    data: {
      userId: req.query.userId as string,
      market: req.query.market as string,
    },
  });
  res.json(response.payload);
});
