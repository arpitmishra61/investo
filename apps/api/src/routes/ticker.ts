import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_CURRENT_PRICE } from "../types/index";
import "dotenv/config";
import prisma from "@repo/database";

export const tradesRouter = Router();
export type TickerDBRow = {
  last_price: number | null;
  low24h: number | null;
  high24h: number | null;
  volume24h: string | null; // NUMERIC from Postgres
  open24h: number | null;
};

export type TickerResponse = {
  lastPrice: number;
  low24h: number;
  high24h: number;
  volume24h: number;
  open24h: number;
  priceChange24h: number;
  priceChangePercent24h: number;
};
export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  const { market } = req.query;
  const rows = await prisma.$queryRaw<TickerDBRow[]>`
WITH last_trade AS (
  SELECT price
  FROM trades
  WHERE market = ${market as string} AND currency_code = ${"$"}
  ORDER BY time DESC
  LIMIT 1
),
trades_24h AS (
  SELECT price, qty, time
  FROM trades
  WHERE market = ${market as string} AND currency_code = ${"$"}
    AND time >= now() - interval '24 hours'
)
SELECT
  (SELECT price FROM last_trade) AS last_price,
  MIN(price) AS low24h,
  MAX(price) AS high24h,
  SUM(qty) AS volume24h,
  (SELECT price FROM trades_24h ORDER BY time ASC LIMIT 1) AS open24h
FROM trades_24h;
`;
  const row = rows[0];

  const last = Number(row.last_price ?? 0);
  const open = Number(row.open24h ?? row.last_price ?? 0);

  const response: TickerResponse = {
    lastPrice: last,
    low24h: Number(row.low24h ?? 0),
    high24h: Number(row.high24h ?? 0),
    volume24h: Number(row.volume24h ?? 0),
    open24h: open,
    priceChange24h: last - open,
    priceChangePercent24h: open === 0 ? 0 : ((last - open) / open) * 100,
  };

  res.json({ result: response });
  // RedisManager.getInstance().sendToWs({
  //   type: "CREATE_TICKER_WS",
  //   data: {
  //     market: market as unknown as string,
  //   },
  // });
});

tickersRouter.get("/current_price", async (req, res) => {
  const { market } = req.query;
  try {
    console.log("doing what here");
    const response = await RedisManager.getInstance().sendAndAwait({
      type: GET_CURRENT_PRICE,
      data: {
        market: market as string,
      },
    });
    console.log(response.type);
    if (response.type === "CURRENT_BALANCE") {
      console.log("reaching here");
      res.json({ currentPrice: response.payload.currentPrice, success: true });
    } else {
      throw new Error("Internal Server Error 404");
    }
  } catch (err) {
    res.json({ success: false, message: err });
  }
});
