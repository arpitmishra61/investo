import { RedisClientType, createClient } from "redis";
import { UserManager } from "./UserManager";

// e.g. "trade@GOOGLE_INR" or "depth@META_INR" → "GOOGLE_INR"
function extractMarket(channel: string): string | null {
  const match = channel.match(/@([A-Z]+_[A-Z]+)$/);
  return match ? match[1] : null;
}

export class SubscriptionManager {
  private static instance: SubscriptionManager;
  private subscriptions: Map<string, string[]> = new Map();
  private reverseSubscriptions: Map<string, string[]> = new Map();
  // track which markets each user is active on
  private userMarkets: Map<string, Set<string>> = new Map();
  private redisClient: RedisClientType;
  private pubClient: RedisClientType;

  private constructor() {
    this.redisClient = createClient();
    this.redisClient.connect();
    this.pubClient = createClient();
    this.pubClient.connect();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SubscriptionManager();
    }
    return this.instance;
  }

  public subscribe(userId: string, subscription: string) {
    if (this.subscriptions.get(userId)?.includes(subscription)) return;

    this.subscriptions.set(userId, (this.subscriptions.get(userId) || []).concat(subscription));

    const prev = this.reverseSubscriptions.get(subscription) || [];
    this.reverseSubscriptions.set(subscription, prev.concat(userId));

    const market = extractMarket(subscription);
    if (market) {
      // track this user → market mapping
      if (!this.userMarkets.has(userId)) this.userMarkets.set(userId, new Set());
      this.userMarkets.get(userId)!.add(market);

      if (prev.length === 0) {
        // first subscriber on this channel — check if market was already active from another channel
        if (!this.hasActiveSubscribersForMarket(market, subscription)) {
          this.pubClient.publish("mm:start", market).catch(console.error);
          console.log(`mm:start → ${market}`);
        }
      }
    }

    if (prev.length === 0) {
      this.redisClient.subscribe(subscription, this.redisCallbackHandler);
    }
  }

  private redisCallbackHandler = (message: string, channel: string) => {
    const parsedMessage = JSON.parse(message);
    this.reverseSubscriptions
      .get(channel)
      ?.forEach((s) => UserManager.getInstance().getUser(s)?.emit(parsedMessage));
  };

  public unsubscribe(userId: string, subscription: string) {
    const userSubs = this.subscriptions.get(userId);
    if (userSubs) {
      this.subscriptions.set(userId, userSubs.filter((s) => s !== subscription));
    }

    const reverse = this.reverseSubscriptions.get(subscription);
    if (reverse) {
      const updated = reverse.filter((s) => s !== userId);
      this.reverseSubscriptions.set(subscription, updated);

      if (updated.length === 0) {
        this.reverseSubscriptions.delete(subscription);
        this.redisClient.unsubscribe(subscription);
      }
    }
  }

  public userLeft(userId: string) {
    console.log("user left " + userId);
    const subs = this.subscriptions.get(userId) || [];
    subs.forEach((s) => this.unsubscribe(userId, s));

    // after all channels cleaned up, check which markets this user was on
    const markets = this.userMarkets.get(userId) || new Set();
    this.userMarkets.delete(userId);

    for (const market of markets) {
      if (!this.hasActiveSubscribersForMarket(market)) {
        this.pubClient.publish("mm:stop", market)
          .then(() => console.log(`mm:stop → ${market}`))
          .catch(console.error);
      }
    }
  }

  getSubscriptions(userId: string) {
    return this.subscriptions.get(userId) || [];
  }

  // check if any channel for this market has subscribers (optionally excluding one channel)
  private hasActiveSubscribersForMarket(market: string, exclude?: string): boolean {
    for (const [channel, users] of this.reverseSubscriptions.entries()) {
      if (channel === exclude) continue;
      if (extractMarket(channel) === market && users.length > 0) return true;
    }
    return false;
  }
}
