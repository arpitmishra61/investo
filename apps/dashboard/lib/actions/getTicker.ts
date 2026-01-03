// actions/getTicker.ts
import { Ticker } from "@repo/types/ticker";

export async function getTicker(): Promise<Ticker[]> {
  const ticker1: Ticker = {
    firstPrice: "1.0057",
    high: "1.0435",
    lastPrice: "0.9915",
    low: "0.9773",
    priceChange: "-0.0142",
    priceChangePercent: "-0.01412",
    quoteVolume: "1812.2481",
    symbol: "BTC/USDT",
    trades: "35",
    volume: "1796",
  };

  const ticker2: Ticker = {
    firstPrice: "2.1057",
    high: "2.2435",
    lastPrice: "2.1915",
    low: "2.0773",
    priceChange: "0.0142",
    priceChangePercent: "0.01412",
    quoteVolume: "2812.2481",
    symbol: "1A_USDC",
    trades: "55",
    volume: "2796",
  };

  return [ticker1, ticker2];
}
