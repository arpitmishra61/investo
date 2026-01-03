export type Trade = {
  id?: number;
  isBuyerMaker?: boolean;
  price: string;
  quantity?: string;
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
