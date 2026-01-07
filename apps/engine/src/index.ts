import { createClient } from "redis";
import { Engine } from "./trade/Engine";
import { CREATE_ORDER, MessageFromApi } from "./types/fromApi";

async function main() {
  const engine = new Engine();
  const redisClient = createClient();
  await redisClient.connect();
  console.log("connected to redis");
  type responseType= {
    message: MessageFromApi;
    clientId: string;
  }
  while (true) {
    const messageFromRedis = await redisClient.rPop("messages" as string);
    if (!messageFromRedis) {
    } else {
      const response = JSON.parse(messageFromRedis) as responseType
      console.log(response)
      if (response.message.type === CREATE_ORDER) {
        response.message.data.timeStamp = Date.now()
      }
      engine.process(response);
    }
  }
}

main();
