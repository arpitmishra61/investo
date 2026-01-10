import { Client } from "pg";
import { createClient } from "redis";
import { DbMessage } from "./types";
import "dotenv/config";

console.log(process.env.DATABASE_URL);
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

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("connected to redis");

  while (true) {
    const response = await redisClient.rPop("db_processor" as string);
    
    if (!response) {
    } else {
      console.log("response", response)
      const res: DbMessage = JSON.parse(response);
      if (res.type === "TRADE_ADDED") {
        console.log("adding res");
        console.log(res);
        const { price, quantity, timestamp, isBuyerMaker } = res.data
        console.log(isBuyerMaker)
        const query = "INSERT INTO tata_prices (time, price,qty,currency_code,side) VALUES (to_timestamp($1), $2,$3,$4, $5)";
        // TODO: How to add volume?
        const values = [ timestamp/1000.0, price,quantity,'$', isBuyerMaker? "buy":"sell"];
        await pgClient.query(query, values);
      }
    }
  }
}

main();
