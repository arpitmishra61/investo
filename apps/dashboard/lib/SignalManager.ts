import { Ticker } from "@repo/types/ticker";

export const BASE_URL = "ws://localhost:5001";

export class SignalingManager {
  private ws: WebSocket;
  private static instance: SignalingManager;
  private bufferedMessages: any[] = [];
  private callbacks: any = {};
  private id: number;
  private initialized: boolean = false;

  private constructor() {
    this.ws = new WebSocket(BASE_URL);
    this.bufferedMessages = [];
    this.id = 1;
    this.init();
  }

  public static getInstance() {
    if (!this.instance) {
      this.instance = new SignalingManager();
    }
    return this.instance;
  }

  init() {
    this.ws.onopen = () => {
      console.log("connecte dBE");
      this.initialized = true;
      this.bufferedMessages.forEach((message) => {
        this.ws.send(JSON.stringify(message));
      });
      this.bufferedMessages = [];
    };
    this.ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log("fe", message);
      const type = message.data.e;
      if (this.callbacks[type]) {
        this.callbacks[type].forEach(({ callback }: any) => {
          if (type === "ticker") {
            const newTicker: Partial<Ticker> = {
              lastPrice: message.data.c,
              high: message.data.h,
              low: message.data.l,
              volume: message.data.v,
              quoteVolume: message.data.V,
              symbol: message.data.s,
            };

            callback(newTicker);
          }
          if (type === "trade") {
            const {
              t: tradeId,
              p: price,
              q: qty,
              ts: time,
              s: side,
            } = message.data;
            const newTrade = {
              tradeId,
              price,
              qty,
              time,
              side: side ? "buy" : "sell",
            };
            callback(newTrade);
          }
          if (type === "depth") {
            const updatedBids = message.data.b;
            const updatedAsks = message.data.a;
            callback({ bids: updatedBids, asks: updatedAsks });
          }
          if (type === "balance") {
            const balance = message.data.b;

            callback(balance);
          }
          if (type === "current_price") {
            console.log("reaching at price");
            const current_balance = message.data.p;
            callback(current_balance);
          }
        });
      }
    };
    this.ws.onerror = (msg) => {
      console.log(msg);
    };
  }

  sendMessage(message: any) {
    console.log("mee", message);
    const messageToSend = {
      ...message,
      id: this.id++,
    };
    if (!this.initialized) {
      this.bufferedMessages.push(messageToSend);
      return;
    }
    console.log("mee", message);

    if (this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WS not open, dropping message", messageToSend);
      return;
    }
    this.ws.send(JSON.stringify(messageToSend));
  }

  stopMM(market: string) {
    this.sendMessage({ method: "MM_STOP", params: [market] });
  }

  startMM(market: string) {
    this.sendMessage({ method: "MM_START", params: [market] });
  }

  async registerCallback(type: string, callback: any, id: string) {
    this.callbacks[type] = this.callbacks[type] || [];
    this.callbacks[type].push({ callback, id });
    // "ticker" => callback
  }

  async deRegisterCallback(type: string, id: string) {
    if (this.callbacks[type]) {
      const index = this.callbacks[type].findIndex(
        (callback) => callback.id === id,
      );
      if (index !== -1) {
        this.callbacks[type].splice(index, 1);
      }
    }
  }
}
