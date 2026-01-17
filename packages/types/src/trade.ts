export type Trade = {
  id?: number;
  side?: "buy" | "sell";
  price: string;
  qty?: string;
  quoteQuantity?: string;
  time: number;
};

export type TradeResponse = { trades: Trade[] };
export type TradeWithLoading = {
  data: Trade[];
  error?: boolean;
  message?: string;
  loading?: boolean;
};

export type CurrentPriceResponse = {
currentPrice:string, success:boolean, message?:string;
};