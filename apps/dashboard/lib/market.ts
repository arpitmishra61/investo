
export type MarketRow = {
  symbol: string;
  name: string;
  price: number;
  volume24h: string;
  openInterest: string;
  change24h: number;
  sparkline: number[];
  icon: string;
};
export const markets: MarketRow[] = [
  {
    symbol: "BTC-PERP",
    name: "Bitcoin",
    price: 90473.1,
    volume24h: "$505.8M",
    openInterest: "$120.3M",
    change24h: -0.93,
    sparkline: [40, 45, 42, 48, 44, 43, 41],
    icon: "🟠",
  },
  {
    symbol: "ETH-PERP",
    name: "Ethereum",
    price: 3089.18,
    volume24h: "$70.7M",
    openInterest: "$51.5M",
    change24h: -0.66,
    sparkline: [30, 35, 33, 38, 34, 32, 31],
    icon: "🔵",
  },
];
