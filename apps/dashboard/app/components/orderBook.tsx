"use client";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useEffect, useState } from "react";
import axios from "axios";
import { OrderBookEntry, OrderBookResponse, OrderBookClient } from "@repo/types/depth";
import { CurrentPriceResponse, Trade, TradeResponse, TradeWithLoading } from "@repo/types/trade";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader } from "./Loader";
import { SignalingManager } from "@/lib/SignalManager";
function setDepthQuantity(res: OrderBookResponse, wsUpdate: Boolean | undefined) {
  let { bids, asks } = res

  let [tbids, tasks] = [[...bids], [...asks]];

  if (wsUpdate) {
    tasks.reverse()
  }
  else {
    tbids.reverse()
  }
  let totalQty = 0;
  bids = tbids.reduce((prevBids: OrderBookEntry[], currentBid) => {
    const [value, qty] = currentBid;
    totalQty += +qty;
    return [
      ...prevBids,
      [value, qty, totalQty.toFixed(2).toString()],
    ] as any;
  }, []);
  totalQty = 0;

  asks = tasks.reduce((prevAsks: OrderBookEntry[], currentAsk) => {
    const [value, qty] = currentAsk;
    totalQty += +qty;
    return [
      ...prevAsks,
      [value, qty, totalQty.toFixed(2).toString()],
    ] as any;
  }, []);

  res.bids = bids;
  res.asks = asks.reverse()
  return res

}
export function OrderBook({ symbol = "TATA_INR" }: { symbol: string }) {
  const market = "TATA_INR"
  const [depth, setDepth] = useState<OrderBookClient>({
    data: {
      lastUpdateId: 0,
      bids: [],
      asks: [],
      symbol: ""
    },
    loading: true,
  });
  const [trades, setTrades] = useState<TradeWithLoading>({
    data: [],
    loading: true,
  });
  const [currentPriceData, setCurrentPriceData] = useState<CurrentPriceResponse | null>(null);
  useEffect(() => {

    SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`depth@${market}`] });
    SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`trade@${market}`] });
    SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`current_price@${market}`] });
    axios.get<OrderBookResponse>(`http://localhost:8000/api/v1/depth?symbol=TATA_INR`).then((res) => {
      const updatedData = setDepthQuantity(res.data, false)
      setDepth({ data: updatedData, loading: false });
    });

    axios.get<TradeResponse>(`http://localhost:8000/api/v1/trades?symbol=${symbol}`).then((res) => {
      setTrades({ data: res.data.trades, loading: false });
    });
    axios.get<CurrentPriceResponse>(`http://localhost:8000/api/v1/tickers/current_price?market=${symbol}`).then((res) => {
      setCurrentPriceData(res.data);
    });
  }, []);

  function updateTheDepth({ update, side, bidsOrAsks }: any) {
    const [price, quantity] = update

    let dataAfterUpdate = bidsOrAsks
    const index = dataAfterUpdate.findIndex(([p]) => {
      return p === price
    });
    if (quantity === "0") {
      if (index !== -1) {
        dataAfterUpdate.splice(index, 1);
      }

    }

    // 🔁 Update existing level
    if (index !== -1 && quantity !== "0") {
      dataAfterUpdate[index][1] = quantity;

    }
    else {
      if (index === -1) {
        let updateDone = false
        for (let i = 0; i < dataAfterUpdate.length; i++) {
          if (+price > +dataAfterUpdate[i][0]) {
            dataAfterUpdate.splice(i, 0, update);
            updateDone = true
            break;
          }
        }
        if (!updateDone) {
          dataAfterUpdate.push(update)
        }
      }
    }
    return dataAfterUpdate
  }
  useEffect(() => {
    SignalingManager.getInstance().registerCallback("depth", (update: { bids: OrderBookEntry[], asks: OrderBookEntry[] }) => {

      if (update?.asks || update?.bids)
        setDepth((prevOrderbook: OrderBookClient) => {

          let bidsAfterUpdate: OrderBookEntry[] = prevOrderbook.data.bids
          let asksAfterUpdate: OrderBookEntry[] = prevOrderbook.data.asks
          let updatedDataWithQty: OrderBookResponse = { bids: [], asks: [] }

          update.bids?.forEach(bid => {
            bidsAfterUpdate = updateTheDepth({ update: bid, side: "bid", bidsOrAsks: bidsAfterUpdate })
          })
          update.asks?.forEach(ask => {
            asksAfterUpdate = updateTheDepth({ update: ask, side: "ask", bidsOrAsks: asksAfterUpdate })
          })
          if (bidsAfterUpdate.length || asksAfterUpdate.length) {
            updatedDataWithQty = setDepthQuantity({ bids: bidsAfterUpdate, asks: asksAfterUpdate }, true)
          }
          return { data: updatedDataWithQty, loading: false }

        });

    }, `DEPTH-${symbol}`);

    SignalingManager.getInstance().registerCallback("trade", (update: Trade) => {
      setTrades((state) => ({
        ...state,
        data: [...state.data, update]
      }))

    }, `TRADE-${symbol}`);

    SignalingManager.getInstance().registerCallback("current_price", (update: string) => {
      console.log("update", update)
      setCurrentPriceData({ currentPrice: update, success: true })
    }, `CURRENT_PRICE-${symbol}`);

    return () => {
      SignalingManager.getInstance().deRegisterCallback("depth", `DEPTH-${symbol}`)
      SignalingManager.getInstance().deRegisterCallback("trade", `TRADE-${symbol}`)
      SignalingManager.getInstance().deRegisterCallback("current_price", `CURRENT_PRICE-${symbol}`)

    }

  }, [symbol])
  const tradesToRender = [...trades.data].reverse()
  return (
    <Card className="p-4 h-full">
      <Tabs defaultValue="orderbook" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-muted">
          <TabsTrigger value="orderbook">Orderbook</TabsTrigger>
          <TabsTrigger value="trades">Trades</TabsTrigger>
        </TabsList>
        <TabsContent value="orderbook" className="mt-4">
          <div className="text-sm">
            {/* Asks */}
            <div className="flex justify-between bg-red mb-3">
              <p>Price</p>
              <p>Qty</p>
              <p>Total</p>
            </div>
            <div>
              {depth.loading
                ? <Loader message="Fetching asks.." />
                : depth?.data?.asks.map((ask, i) => (
                  <>
                    <Row
                      key={i}
                      price={+ask[0]}
                      amount={+ask[1]}
                      qty={ask[2]}
                      color="red"
                    />
                    <Separator />
                  </>
                ))}
            </div>
            <strong className="mt-2">{currentPriceData && currentPriceData.currentPrice}</strong>
            {/* Bids */}
            <div className="mt-1">
              {depth.loading
                ? <Loader message="Fetching bids.." />
                : depth.data?.bids.map((bid, i) => (
                  <>
                    <Row
                      key={i}
                      price={+bid[0]}
                      amount={+bid[1]}
                      color="green"
                      qty={bid[2]}
                    />
                    <Separator />
                  </>
                ))}
            </div>
          </div>
        </TabsContent>
        <TabsContent value="trades">
          <div className="flex justify-between bg-red mb-3">
            <p>Price</p>
            <p>Qty</p>
            <p>Time</p>

          </div>
          <div>
            {trades.loading
              ? <Loader message="Fetching Trades.." />
              : tradesToRender.map((trade, i) => (
                <>
                  <Row
                    key={i}
                    price={+trade.price}
                    time={new Date(trade.time).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                      second: "2-digit",
                      hour12: false
                    })}
                    qty={trade.qty}
                    color={trade.side === "buy" ? "green" : "red"}
                  />
                  <Separator />
                </>
              ))}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
}

function Row({
  price,
  amount,
  time,
  qty,
  color,
}: {
  price: number;
  amount?: number;
  color?: "green" | "red";
  qty: string;
  time?: string
}) {
  return (
    <div className="flex justify-between">
      <strong className={color === "green" ? "text-green-600" : "text-red-600"}>
        {price.toLocaleString()}
      </strong>
      {amount && <span>{amount}</span>}
      <span>{qty}</span>
      {time && <span>{time}</span>}

    </div>
  );
}
