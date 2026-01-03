import { Client } from "pg";
import { Router } from "express";
import { RedisManager } from "../RedisManager";
import "dotenv/config";

const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
});
pgClient
  .connect()
  .then(() => {
    console.log("api connected to db");
  })
  .catch((err) => {
    console.log("err ", err);
  });
export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
  const { market, interval, startTime, endTime } = req.query as any;
  console.log("here");
  let query;
  switch (interval) {
    case "1m":
      query = `SELECT * FROM klines_1m WHERE bucket >= $1 AND bucket <= $2 ORDER BY bucket ASC`;
      break;
    case "1h":
      query = `SELECT * FROM klines_1m WHERE  bucket >= $1 AND bucket <= $2`;
      break;
    case "1w":
      query = `SELECT * FROM klines_1w WHERE bucket >= $1 AND bucket <= $2`;
      break;
    default:
      return res.status(400).send("Invalid interval");
  }

  try {
    //@ts-ignore
    const result = await pgClient.query(query, [
      new Date(+startTime as unknown as string),
      new Date(+endTime as unknown as string),
    ]);
    console.log("result time", result.rows);
    console.log(new Date(+startTime));
    console.log(new Date(+endTime));
    res.json(
      result.rows.map((x) => ({
        close: x.close,
        time: Math.floor(new Date(x.bucket).getTime() / 1000),
        high: x.high,
        low: x.low,
        open: x.open,
        quoteVolume: x.quoteVolume,
        start: x.start,
        trades: x.trades,
        volume: x.volume,
      }))
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
