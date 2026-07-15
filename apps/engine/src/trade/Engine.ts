import { CurrentPrice } from './../../../../node_modules/@repo/types/src/trade';
import { orderBook } from './../../../dashboard/lib/mockData';
import fs from "fs";
import { RedisManager } from "../RedisManager";
import { ORDER_UPDATE, TRADE_ADDED } from "../types/index";
import {
  CANCEL_ORDER,
  CREATE_ORDER,
  GET_DEPTH,
  GET_OPEN_ORDERS,
  MessageFromApi,
  ON_RAMP,
  GET_BALANCE,
  GET_CURRENT_PRICE,
  RESET_ENGINE
} from "../types/fromApi";
import { Fill, Order, Orderbook } from "./Orderbook";

//TODO: Avoid floats everywhere, use a decimal similar to the PayTM project for every currency
export const BASE_CURRENCY = "INR";

interface UserBalance {
  [key: string]: {
    available: number;
    locked: number;
  };
}

export class Engine {
  private orderbooks: Orderbook[] = [];
  private balances: Map<string, UserBalance> = new Map();

  constructor() {
    let snapshot = null;
    try {
      if (process.env.WITH_SNAPSHOT) {
        snapshot = fs.readFileSync("./snapshot.json");
      }
    } catch (e) {
      console.log("No snapshot found");
    }
    console.log("snapshot", snapshot);
    if (snapshot) {
      const snapshotSnapshot = JSON.parse(snapshot.toString());
      this.orderbooks = snapshotSnapshot.orderbooks.map(
        (o: any) =>
          new Orderbook(
            o.baseAsset,
            o.bids,
            o.asks,
            o.lastTradeId,
            o.currentPrice
          )
      );
      this.balances = new Map(snapshotSnapshot.balances);
    } else {
      this.orderbooks = [
        new Orderbook(`TATA`, [], [], 0, 0),
        new Orderbook(`GOOGLE`, [], [], 0, 0),
        new Orderbook(`META`, [], [], 0, 0),
      ];
      this.setBaseBalances();
    }
    setInterval(() => {
      this.saveSnapshot();
    }, 1000 * 3);
  }

  saveSnapshot() {
    const snapshotSnapshot = {
      orderbooks: this.orderbooks.map((o) => o.getSnapshot()),
      balances: Array.from(this.balances.entries()),
    };
    fs.writeFileSync("./snapshot.json", JSON.stringify(snapshotSnapshot));
  }

  process({
    message,
    clientId,
  }: {
    message: MessageFromApi;
    clientId: string;
  }) {
    switch (message.type) {
      case CREATE_ORDER:
        try {
          console.log(message);
          const { executedQty, fills, orderId, rQuantity } = this.createOrder(
            message.data.market,
            message.data.price,
            message.data.quantity,
            message.data.side,
            message.data.userId,
            message.data.timeStamp
          );
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_PLACED",
            payload: {
              orderId,
              executedQty,
              fills,
              rQuantity
            },
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId: "",
              executedQty: 0,
              remainingQty: 0,
              error: e instanceof Error ? e.message : "Order rejected",
            },
          });
        }
        break;
      case CANCEL_ORDER:
        try {
          const orderId = message.data.orderId;
          const cancelMarket = message.data.market;
          const cancelOrderbook = this.orderbooks.find(
            (o) => o.ticker() === cancelMarket
          );
          const quoteAsset = cancelMarket.split("_")[1];
          if (!cancelOrderbook) {
            throw new Error("No orderbook found");
          }

          const order =
            cancelOrderbook.asks.find((o) => o.orderId === orderId) ||
            cancelOrderbook.bids.find((o) => o.orderId === orderId);
          if (!order) {
            console.log("No order found");
            throw new Error("No order found");
          }

          if (order.side === "buy") {
            const price = cancelOrderbook.cancelBid(order);
            const leftQuantity = (order.quantity - order.filled) * order.price;
            //@ts-ignore
            this.balances.get(order.userId)[BASE_CURRENCY].available +=
              leftQuantity;
            //@ts-ignore
            this.balances.get(order.userId)[BASE_CURRENCY].locked -=
              leftQuantity;
            if (price) {
              this.sendUpdatedDepthAt(price.toString(), cancelMarket);
            }
          } else {
            const price = cancelOrderbook.cancelAsk(order);
            const leftQuantity = order.quantity - order.filled;
            //@ts-ignore
            this.balances.get(order.userId)[quoteAsset].available +=
              leftQuantity;
            //@ts-ignore
            this.balances.get(order.userId)[quoteAsset].locked -= leftQuantity;
            if (price) {
              this.sendUpdatedDepthAt(price.toString(), cancelMarket);
            }
          }

          RedisManager.getInstance().sendToApi(clientId, {
            type: "ORDER_CANCELLED",
            payload: {
              orderId,
              executedQty: 0,
              remainingQty: 0,
            },
          });
        } catch (e) {
          console.log("Error hwile cancelling order");
          console.log(e);
        }
        break;
      case GET_OPEN_ORDERS:
        try {
          const openOrderbook = this.orderbooks.find(
            (o) => o.ticker() === message.data.market
          );
          if (!openOrderbook) {
            console.log("this.orderbooks", this.orderbooks);
            throw new Error("No orderbook found");
          }
          const openOrders = openOrderbook.getOpenOrders(message.data.userId);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "OPEN_ORDERS",
            payload: openOrders,
          });
        } catch (e) {
          console.log(e);
        }
        break;
      case ON_RAMP:
        const userId = message.data.userId;
        const amount = Number(message.data.amount);
        this.onRamp(userId, amount);
        break;
      case GET_DEPTH:
        try {
          const market = message.data.market;
          const orderbook = this.orderbooks.find((o) => o.ticker() === market);
          if (!orderbook) {
            throw new Error("No orderbook found");
          }
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: orderbook.getDepth(),
          });
        } catch (e) {
          console.log(e);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "DEPTH",
            payload: {
              bids: [],
              asks: [],
            },
          });
        }
        break;

      case GET_BALANCE: {
        try {
          const { userId } = message.data
          console.log("reachumngh erher", userId)
          const userBalance = this.balances.get(userId);
          console.log("baa", userBalance)
          RedisManager.getInstance().sendToApi(clientId, {
            type: "BALANCE",
            payload: userBalance as unknown as Record<"available" | "locked", number>
          });

        }
        catch (err) {
          console.log("Fetching balance error", err)
        }

      }
        break;
      case GET_CURRENT_PRICE: {
        try {
          const { market } = message.data

          const orderbook = this.orderbooks.find((o) => o.ticker() === market);
console.log("FsdfgsgsG",orderbook?.currentPrice)
          RedisManager.getInstance().sendToApi(clientId, {
            type: "CURRENT_BALANCE",
            payload: { currentPrice:orderbook?.currentPrice ?? 0
          }
          });

        }
        catch (err) {
          console.log("Fetching balance error", err)
        }

      }
        break;
      case RESET_ENGINE: {
        try {
          this.reset();
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ENGINE_RESET",
            payload: { ok: true },
          });
        } catch (err) {
          console.log("Engine reset error", err);
          RedisManager.getInstance().sendToApi(clientId, {
            type: "ENGINE_RESET",
            payload: { ok: false },
          });
        }
      }
        break;
    }
  }

  reset() {
    this.orderbooks = [
      new Orderbook(`TATA`, [], [], 0, 0),
      new Orderbook(`GOOGLE`, [], [], 0, 0),
      new Orderbook(`META`, [], [], 0, 0),
    ];
    this.balances = new Map();
    this.setBaseBalances();
    this.saveSnapshot();
    console.log("Engine state reset: orderbooks cleared, balances re-seeded");
  }

  addOrderbook(orderbook: Orderbook) {
    this.orderbooks.push(orderbook);
  }

  createOrder(
    market: string,
    price: string,
    quantity: string,
    side: "buy" | "sell",
    userId: string,
    timeStamp: number,
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    const baseAsset = market.split("_")[0];
    const quoteAsset = market.split("_")[1];

    if (!orderbook) {
      throw new Error("No orderbook found");
    }

    this.checkAndLockFunds(
      baseAsset,
      quoteAsset,
      side,
      userId,
      quoteAsset,
      price,
      quantity
    );

    const order: Order = {
      price: Number(price),
      quantity: Number(quantity),
      orderId:
        Math.random().toString(36).substring(2, 15) +
        Math.random().toString(36).substring(2, 15),
      filled: 0,
      side,
      userId,
      timeStamp,
      rQuantity: +quantity
    };

    const { fills, executedQty, rQuantity } = orderbook.addOrder(order);
    console.log("rQuantity---", rQuantity)
    if (fills.length) {
      orderbook.updateCurrentPrice(fills)
    }
    this.updateBalance(userId, baseAsset, quoteAsset, side, fills, executedQty);
    this.createDbTrades(fills, market, userId, side);
    this.updateDbOrders(order, executedQty, fills, market);
    this.publisWsDepthUpdates(fills, price, side, market);
    this.publishWsTrades(fills, userId, market);
    this.publishBalanceUpdate(userId)
    this.publishCurrentPriceUpdate(orderbook.currentPrice, market)
    return { executedQty, fills, orderId: order.orderId, rQuantity };
  }

  updateDbOrders(
    order: Order,
    executedQty: number,
    fills: Fill[],
    market: string
  ) {
    RedisManager.getInstance().pushMessage({
      type: ORDER_UPDATE,
      data: {
        orderId: order.orderId,
        executedQty: executedQty,
        market: market,
        price: order.price.toString(),
        quantity: order.quantity.toString(),
        side: order.side,
      },
    });

    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: ORDER_UPDATE,
        data: {
          orderId: fill.markerOrderId,
          executedQty: fill.qty,
        },
      });
    });
  }

  createDbTrades(
    fills: Fill[],
    market: string,
    userId: string,
    side: "buy" | "sell"
  ) {
    fills.forEach((fill) => {
      RedisManager.getInstance().pushMessage({
        type: TRADE_ADDED,
        data: {
          market: market,
          id: fill.tradeId.toString(),
          isBuyerMaker: fill.otherUserId === userId, // TODO: Is this right?
          price: fill.price,
          quantity: fill.qty.toString(),
          quoteQuantity: (fill.qty * Number(fill.price)).toString(),
          timestamp: Date.now(),
          // taker = the user whose incoming order triggered this fill (`side`);
          // maker = the resting order's owner on the opposite side.
          takerUserId: userId,
          makerUserId: fill.otherUserId,
          takerSide: side,
        },
      });
    });
  }

  publishWsTrades(fills: Fill[], userId: string, market: string) {
    fills.forEach((fill) => {
      RedisManager.getInstance().publishMessage(`trade@${market}`, {
        stream: `trade@${market}`,
        data: {
          e: "trade",
          t: fill.tradeId,
          m: fill.otherUserId === userId, // TODO: Is this right?
          p: fill.price,
          q: fill.qty.toPrecision(3),
          s: market,
          ts: fill.timeStamp
        },
      });
    });
  }

  sendUpdatedDepthAt(price: string, market: string) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    console.log(depth.asks)

    const updatedBids = depth?.bids.filter((x) => x[0] === price);
    const updatedAsks = depth?.asks.filter((x) => x[0] === price);

    RedisManager.getInstance().publishMessage(`depth@${market}`, {
      stream: `depth@${market}`,
      data: {
        a: updatedAsks.length ? updatedAsks : [[price, "0"]],
        b: updatedBids.length ? updatedBids : [[price, "0"]],
        e: "depth",
      },
    });
  }
  fillsNotPresentInAsks(fills: Fill[], asks: [string, string][]): Fill[] {
    return fills.filter(fill => asks.filter(ask => ask[0] === fill.price).length == 0)

  }
  fillsNotPresentInBids(fills: Fill[], bids: [string, string][]): Fill[] {
    return fills.filter(fill => bids.filter(bid => bid[0] === fill.price).length == 0)

  }
  publisWsDepthUpdates(
    fills: Fill[],
    price: string,
    side: "buy" | "sell",
    market: string
  ) {
    const orderbook = this.orderbooks.find((o) => o.ticker() === market);
    if (!orderbook) {
      return;
    }
    const depth = orderbook.getDepth();
    console.log("ws", depth.asks)
    if (side === "buy") {
      const updatedAsks = depth?.asks.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString())
      );
      const completeFills: Fill[] = this.fillsNotPresentInAsks(fills, depth?.asks)
      let completedAsks: [string, string][] = completeFills.map(fill => [`${fill.price}`, '0'])
      //remove duplicates 
      completedAsks = [...new Map(completedAsks.map(x => [x[0], x])).values()]

      console.log("completedAsks", completedAsks)
      updatedAsks.push(...completedAsks)


      const updatedBid = depth?.bids.find((x) => x[0] === price);
      console.log("publish ws depth updates", updatedBid, updatedAsks);
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsks,
          b: updatedBid ? [updatedBid] : [],
          e: "depth",
        },
      });
    }
    if (side === "sell") {
      const updatedBids = depth?.bids.filter((x) =>
        fills.map((f) => f.price).includes(x[0].toString())
      );

      const updatedAsk = depth?.asks.find((x) => x[0] === price);
      const completeFills: Fill[] = this.fillsNotPresentInBids(fills, depth?.bids)
      let completedBids: [string, string][] = completeFills.map(fill => [`${fill.price}`, '0'])
      completedBids = [...new Map(completedBids.map(x => [x[0], x])).values()]

      updatedBids.push(...completedBids)
      console.log("publish ws depth updates", updatedBids, updatedAsk);
      RedisManager.getInstance().publishMessage(`depth@${market}`, {
        stream: `depth@${market}`,
        data: {
          a: updatedAsk ? [updatedAsk] : [],
          b: updatedBids,
          e: "depth",
        },
      });
    }
  }
  publishBalanceUpdate(userId: string) {
    const balances = this.balances.get(userId)

    RedisManager.getInstance().publishMessage(`balance@${userId}`, {
      stream: `depth@${userId}`,
      data: {
        e: "balance",
        b: balances
      },
    });
  }
  publishCurrentPriceUpdate(price: number, market: string) {
    RedisManager.getInstance().publishMessage(`current_price@${market}`, {
      stream: `current_price@${market}`,
      data: {
        e: "current_price",
        p: price
      },
    })
  }


  updateBalance(
    userId: string,
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    fills: Fill[],
    executedQty: number
  ) {
    if (side === "buy") {
      fills.forEach((fill) => {
        // Update quote asset balance
        //@ts-ignore
        this.balances.get(fill.otherUserId)[quoteAsset].available =
          this.balances.get(fill.otherUserId)?.[quoteAsset].available +
          fill.qty * fill.price;

        //@ts-ignore
        this.balances.get(userId)[quoteAsset].locked =
          this.balances.get(userId)?.[quoteAsset].locked -
          fill.qty * fill.price;

        // Update base asset balance

        //@ts-ignore
        this.balances.get(fill.otherUserId)[baseAsset].locked =
          this.balances.get(fill.otherUserId)?.[baseAsset].locked - fill.qty;

        //@ts-ignore
        this.balances.get(userId)[baseAsset].available =
          this.balances.get(userId)?.[baseAsset].available + fill.qty;
      });
    } else {
      fills.forEach((fill) => {
        // Update quote asset balance
        //@ts-ignore
        this.balances.get(fill.otherUserId)[quoteAsset].locked =
          this.balances.get(fill.otherUserId)?.[quoteAsset].locked -
          fill.qty * fill.price;

        //@ts-ignore
        this.balances.get(userId)[quoteAsset].available =
          this.balances.get(userId)?.[quoteAsset].available +
          fill.qty * fill.price;

        // Update base asset balance

        //@ts-ignore
        this.balances.get(fill.otherUserId)[baseAsset].available =
          this.balances.get(fill.otherUserId)?.[baseAsset].available + fill.qty;

        //@ts-ignore
        this.balances.get(userId)[baseAsset].locked =
          this.balances.get(userId)?.[baseAsset].locked - fill.qty;
      });
    }
  }

  checkAndLockFunds(
    baseAsset: string,
    quoteAsset: string,
    side: "buy" | "sell",
    userId: string,
    asset: string,
    price: string,
    quantity: string
  ) {
    if (side === "buy") {
      if (
        (this.balances.get(userId)?.[quoteAsset]?.available || 0) <
        Number(quantity) * Number(price)
      ) {
        throw new Error("Insufficient funds");
      }
      //@ts-ignore
      this.balances.get(userId)[quoteAsset].available =
        this.balances.get(userId)?.[quoteAsset].available -
        Number(quantity) * Number(price);

      //@ts-ignore
      this.balances.get(userId)[quoteAsset].locked =
        this.balances.get(userId)?.[quoteAsset].locked +
        Number(quantity) * Number(price);
    } else {
      if (
        (this.balances.get(userId)?.[baseAsset]?.available || 0) <
        Number(quantity)
      ) {
        throw new Error("Insufficient funds");
      }
      //@ts-ignore
      this.balances.get(userId)[baseAsset].available =
        this.balances.get(userId)?.[baseAsset].available - Number(quantity);

      //@ts-ignore
      this.balances.get(userId)[baseAsset].locked =
        this.balances.get(userId)?.[baseAsset].locked + Number(quantity);
    }
  }

  onRamp(userId: string, amount: number) {
    const userBalance = this.balances.get(userId);
    if (!userBalance) {
      this.balances.set(userId, {
        [BASE_CURRENCY]: {
          available: amount,
          locked: 0,
        },
      });
    } else {
      userBalance[BASE_CURRENCY].available += amount;
    }
  }

  setBaseBalances() {
    for (const userId of ["1", "2", "3"]) {
      this.balances.set(userId, {
        [BASE_CURRENCY]: {
          available: 10000000,
          locked: 0,
        },
        TATA: {
          available: 10000000,
          locked: 0,
        },
        GOOGLE: {
          available: 10000000,
          locked: 0,
        },
        META: {
          available: 10000000,
          locked: 0,
        },
      });
    }
  }
}
