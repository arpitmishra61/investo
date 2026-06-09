import { RedisClientType, createClient } from "redis";
import { MessageFromOrderbook } from "./types";
import { MessageToEngine, MessageToWs } from "./types/to";

export class RedisManager {
  private client: RedisClientType;
  private publisher: RedisClientType;
  private static instance: RedisManager;

  private constructor() {
    this.client = createClient();
    this.client.connect();
    this.publisher = createClient();
    this.publisher.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new RedisManager();
    }
    return this.instance;
  }

  public sendAndAwait(message: MessageToEngine) {
    return new Promise<MessageFromOrderbook>((resolve) => {
      const id = this.getRandomClientId();
      this.client.subscribe(id, (message) => {
        this.client.unsubscribe(id);
        resolve(JSON.parse(message));
      });
      console.log(message);
      this.publisher.lPush(
        "messages",
        JSON.stringify({ clientId: id, message }),
      );
    });
  }
  public sendToWs(message: MessageToWs) {
    const id = this.getRandomClientId();
    let interval: any;
    this.client.subscribe(id, (message) => {
      this.client.unsubscribe(id);
      clearInterval(interval);
    });
    interval = setInterval(() => {
      this.publisher.lPush(
        "messages",
        JSON.stringify({ clientId: id, message }),
      );
    }, 5000);
  }

  public getRandomClientId() {
    return (
      Math.random().toString(36).substring(2, 15) +
      Math.random().toString(36).substring(2, 15)
    );
  }
}
