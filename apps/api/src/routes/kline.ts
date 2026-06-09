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
  console.log("here ", interval);
  let query;
  if (["1m", "1h"].includes(interval)) {
    query = `SELECT * FROM klines_${interval} WHERE bucket >= $1 AND bucket <= $2 ORDER BY bucket ASC`;
  } else {
    return res.status(400).send("Invalid interval");
  }

  try {
    //@ts-ignore
    const result = await pgClient.query(query, [
      new Date(+startTime as unknown as string),
      new Date(+endTime as unknown as string),
    ]);

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
      })),
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
