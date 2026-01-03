export type OrderBookEntry = [price: string, quantity: string];

export type OrderBookResponse = {
  lastUpdateId?: number;
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  symbol?: string;
};

export type OrderBookClient = {
  data: OrderBookResponse;
  loading: boolean;
};
