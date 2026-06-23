import { createClient } from "redis";
import { prisma } from "@repo/database";
import { DbMessage } from "./types";
import "dotenv/config";

async function main() {
  const redisClient = createClient();
  await redisClient.connect();
  console.log("connected to redis");

  while (true) {
    const response = await redisClient.rPop("db_processor" as string);

    if (!response) {
    } else {
      console.log("response", response);
      const res: DbMessage = JSON.parse(response);
      if (res.type === "TRADE_ADDED") {
        console.log("adding res");
        console.log(res);
        const { price, quantity, timestamp, isBuyerMaker, market } = res.data;
        console.log(isBuyerMaker);
        // TODO: How to add volume?
        await prisma.trade
          .create({
            data: {
              time: new Date(timestamp),
              market,
              price: parseFloat(price),
              qty: quantity,
              currencyCode: "$",
              side: isBuyerMaker ? "buy" : "sell",
            },
          })
          .then(console.log)
          .catch(console.log);
      }
    }
  }
}

main();
