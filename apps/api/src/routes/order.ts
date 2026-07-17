import { Router } from "express";
import prisma from "@repo/database";
import { RedisManager } from "../RedisManager";
import { AuthedRequest } from "../middleware/auth";
import {
  CREATE_ORDER,
  CANCEL_ORDER,
  ON_RAMP,
  GET_OPEN_ORDERS,
} from "../types/index";

export const orderRouter = Router();

// Top 10 most recent executed orders (trades) for the authenticated user
orderRouter.get("/executed_orders", async (req: AuthedRequest, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  try {
    const rows = await prisma.fill.findMany({
      where: { userId: BigInt(userId) },
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

orderRouter.post("/", async (req: AuthedRequest, res) => {
  const { market, price, quantity, side } = req.body;
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
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
  if (response.type === "ORDER_CANCELLED") {
    res.status(400).json(response.payload);
    return;
  }
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
orderRouter.get("/open", async (req: AuthedRequest, res) => {
  if (!req.userId) {
    return res.status(401).json({ error: "Authentication required" });
  }
  const response = await RedisManager.getInstance().sendAndAwait({
    type: GET_OPEN_ORDERS,
    data: {
      userId: req.userId,
      market: req.query.market as string,
    },
  });
  res.json(response.payload);
});
