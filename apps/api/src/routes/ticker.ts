import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_CURRENT_PRICE } from "../types/index";
import "dotenv/config";
import { Client } from "pg";

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
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
});
pgClient
  .connect()
  .then(() => {
    console.log("connected to db ticker");
  })
  .catch((err) => {
    console.log("err ", err);
  });
export const tickersRouter = Router();

tickersRouter.get("/", async (req, res) => {
  const { market } = req.query;
  const query = `
WITH last_trade AS (
  SELECT price
  FROM tata_prices
  WHERE currency_code = $1
  ORDER BY time DESC
  LIMIT 1
),
trades_24h AS (
  SELECT price, qty, time
  FROM tata_prices
  WHERE currency_code = $1
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

  const result = await pgClient.query(query, ["$"]);

  const row: TickerDBRow = result.rows[0];

  const last = Number(row.last_price);
  const open = Number(row.open24h ?? row.last_price);

  const response: TickerResponse = {
    lastPrice: last,
    low24h: Number(row.low24h),
    high24h: Number(row.high24h),
    volume24h: Number(row.volume24h),
    open24h: open,
    priceChange24h: last - open,
    priceChangePercent24h: ((last - open) / open) * 100,
  };

  res.json({ result: response });
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
