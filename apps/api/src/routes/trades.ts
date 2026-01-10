import { Router } from "express";
import { Client } from "pg";
import "dotenv/config";

export const tradesRouter = Router();
const pgClient = new Client({
  connectionString: process.env.DATABASE_URL,
});
pgClient
  .connect()
  .then(() => {
    console.log("connected to db");
  })
  .catch((err) => {
    console.log("err ", err);
  });
tradesRouter.get("/", async (req, res) => {
  const { market } = req.query;
  console.log(market);
  try {
    const query = "SELECT * FROM tata_prices WHERE time >= CURRENT_DATE AND time <= CURRENT_DATE + INTERVAL '1 day' LIMIT $1";
    const result = await pgClient.query(query, [10]);
    console.log("result", result.rows);
    // get from DB
    res.json({ trades: result.rows });
  } catch (err) {
    console.log("err", err);
  }
});
