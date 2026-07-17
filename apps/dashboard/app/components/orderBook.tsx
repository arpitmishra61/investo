"use client";
import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import axios from "axios";
import { OrderBookEntry, OrderBookResponse, OrderBookClient } from "@repo/types/depth";
import { CurrentPriceResponse, Trade, TradeResponse, TradeWithLoading } from "@repo/types/trade";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "./Loader";
import { SignalingManager } from "@/lib/SignalManager";
import { API_URL } from "@/lib/config";

function setDepthQuantity(res: OrderBookResponse, wsUpdate: Boolean | undefined) {
  let { bids, asks } = res;
  let [tbids, tasks] = [[...bids], [...asks]];
  if (wsUpdate) tasks.reverse(); else tbids.reverse();

  let totalQty = 0;
  bids = tbids.reduce((prevBids: OrderBookEntry[], currentBid) => {
    const [value, qty] = currentBid;
    totalQty += +qty;
    return [...prevBids, [value, qty, totalQty.toFixed(2).toString()]] as any;
  }, []);
  totalQty = 0;
  asks = tasks.reduce((prevAsks: OrderBookEntry[], currentAsk) => {
    const [value, qty] = currentAsk;
    totalQty += +qty;
    return [...prevAsks, [value, qty, totalQty.toFixed(2).toString()]] as any;
  }, []);
  res.bids = bids;
  res.asks = asks.reverse();
  return res;
}

export function OrderBook({ symbol = "TATA_INR" }: { symbol: string }) {
  const market = symbol;
  const [depth, setDepth] = useState<OrderBookClient>({ data: { lastUpdateId: 0, bids: [], asks: [], symbol: "" }, loading: true });
  const [trades, setTrades] = useState<TradeWithLoading>({ data: [], loading: true });
  const [currentPriceData, setCurrentPriceData] = useState<CurrentPriceResponse | null>(null);

  useEffect(() => {
    SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`depth@${market}`] });
    SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`trade@${market}`] });
    SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`current_price@${market}`] });

    axios.get<OrderBookResponse>(`${API_URL}/api/v1/depth?symbol=${symbol}`).then((res) => {
      setDepth({ data: setDepthQuantity(res.data, false), loading: false });
    });
    axios.get<TradeResponse>(`${API_URL}/api/v1/trades?symbol=${symbol}`).then((res) => {
      setTrades({ data: res.data.trades, loading: false });
    });
    axios.get<CurrentPriceResponse>(`${API_URL}/api/v1/tickers/current_price?market=${symbol}`).then((res) => {
      setCurrentPriceData(res.data);
    });
  }, []);

  function updateTheDepth({ update, bidsOrAsks }: any) {
    const [price, quantity] = update;
    let dataAfterUpdate = bidsOrAsks;
    const index = dataAfterUpdate.findIndex(([p]: any) => p === price);
    if (quantity === "0") { if (index !== -1) dataAfterUpdate.splice(index, 1); }
    else if (index !== -1) { dataAfterUpdate[index][1] = quantity; }
    else {
      let updateDone = false;
      for (let i = 0; i < dataAfterUpdate.length; i++) {
        if (+price > +dataAfterUpdate[i][0]) { dataAfterUpdate.splice(i, 0, update); updateDone = true; break; }
      }
      if (!updateDone) dataAfterUpdate.push(update);
    }
    return dataAfterUpdate;
  }

  useEffect(() => {
    SignalingManager.getInstance().registerCallback("depth", (update: { bids: OrderBookEntry[], asks: OrderBookEntry[] }) => {
      if (update?.asks || update?.bids)
        setDepth((prev: OrderBookClient) => {
          let bidsAfterUpdate = prev.data.bids;
          let asksAfterUpdate = prev.data.asks;
          let updatedDataWithQty: OrderBookResponse = { bids: [], asks: [] };
          update.bids?.forEach(bid => { bidsAfterUpdate = updateTheDepth({ update: bid, bidsOrAsks: bidsAfterUpdate }); });
          update.asks?.forEach(ask => { asksAfterUpdate = updateTheDepth({ update: ask, bidsOrAsks: asksAfterUpdate }); });
          if (bidsAfterUpdate.length || asksAfterUpdate.length)
            updatedDataWithQty = setDepthQuantity({ bids: bidsAfterUpdate, asks: asksAfterUpdate }, true);
          return { data: updatedDataWithQty, loading: false };
        });
    }, `DEPTH-${symbol}`);

    SignalingManager.getInstance().registerCallback("trade", (update: Trade) => {
      setTrades((state) => ({ ...state, data: [...state.data, update] }));
    }, `TRADE-${symbol}`);

    SignalingManager.getInstance().registerCallback("current_price", (update: string) => {
      setCurrentPriceData({ currentPrice: update, success: true });
    }, `CURRENT_PRICE-${symbol}`);

    return () => {
      SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${symbol}`);
      SignalingManager.getInstance().deRegisterCallback("trade", `TRADE-${symbol}`);
      SignalingManager.getInstance().deRegisterCallback("current_price", `CURRENT_PRICE-${symbol}`);
      SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`depth@${market}`] });
      SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`trade@${market}`] });
      SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`current_price@${market}`] });
    };
  }, [symbol]);

  const tradesToRender = [...trades.data].reverse();

  return (
    <Card className="p-4 h-full">
      <Tabs defaultValue="orderbook" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted p-1 rounded-lg">
          <TabsTrigger value="orderbook" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Orderbook</TabsTrigger>
          <TabsTrigger value="trades" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Trades</TabsTrigger>
        </TabsList>

        <TabsContent value="orderbook" className="mt-4">
          <div className="text-sm">
            <div className="flex justify-between text-xs text-muted-foreground font-medium mb-2 px-1">
              <p>Price</p><p>Qty</p><p>Total</p>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md bg-red-500/8 glass-scroll">
              {depth.loading ? <Loader message="Fetching asks.." /> : depth.data.asks.map((ask, i) => (
                <Row key={i} price={+ask[0]} amount={+ask[1]} qty={ask[2]} color="red" />
              ))}
            </div>
            <div className="flex items-center justify-center my-2 py-2 rounded-md bg-muted border border-border">
              <strong className="text-base font-mono">₹ {(+currentPriceData?.currentPrice || 0).toFixed(2)}</strong>
            </div>
            <div className="max-h-48 overflow-y-auto rounded-md bg-emerald-500/8 glass-scroll">
              {depth.loading ? <Loader message="Fetching bids.." /> : depth.data.bids.map((bid, i) => (
                <Row key={i} price={+bid[0]} amount={+bid[1]} color="green" qty={bid[2]} />
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trades" className="mt-4">
          <div className="flex justify-between text-xs text-muted-foreground font-medium mb-2 px-1">
            <p>Price</p><p>Qty</p><p>Time</p>
          </div>
          <div className="max-h-96 overflow-y-auto rounded-md glass-scroll">
            {trades.loading ? <Loader message="Fetching Trades.." /> : tradesToRender.map((trade, i) => (
              <Row
                key={i}
                price={+trade.price}
                time={new Date(trade.time).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false })}
                qty={trade.qty}
                color={trade.side === "buy" ? "green" : "red"}
              />
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function Row({ price, amount, time, qty, color }: { price: number; amount?: number; color?: "green" | "red"; qty: string; time?: string }) {
  return (
    <div className="flex justify-between items-center px-1.5 py-1 text-sm hover:bg-accent/60 rounded-sm transition-colors relative">

      <strong className={color === "green" ? "text-emerald-500" : "text-red-500"}>
        {price.toLocaleString()}
      </strong>
      {amount && <span className="text-muted-foreground">{+amount.toFixed(2)}</span>}
      <span className="text-muted-foreground">{qty}</span>
      {time && <span className="text-muted-foreground text-xs">{time}</span>}
    </div>
  );
}
