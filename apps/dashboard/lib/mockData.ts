export const ticker = {
  symbol: "BTC/USDT",
  price: 87496.34,
  change: 0.51,
  high: 87792.7,
  low: 86985.03,
  volume: 473_418_262,
};

export const orderBook = {
  bids: Array.from({ length: 15 }, (_, i) => ({
    price: 87490 - i * 2,
    amount: +(Math.random() * 2).toFixed(4),
  })),
  asks: Array.from({ length: 15 }, (_, i) => ({
    price: 87500 + i * 2,
    amount: +(Math.random() * 2).toFixed(4),
  })),
};

// 1m candles (mock)
export const candles1m = Array.from({ length: 200 }, (_, i) => {
  const base = 87000 + Math.random() * 500;
  return {
    time: Math.floor(Date.now() / 1000) - (200 - i) * 60,
    open: base,
    high: base + Math.random() * 100,
    low: base - Math.random() * 100,
    close: base + Math.random() * 50 - 25,
  };
});

// 1s candles
export const candles1s = Array.from({ length: 200 }, (_, i) => {
  const base = 87500 + Math.random() * 50;
  return {
    time: (Math.floor(Date.now() / 1000) - (200 - i)).toString(),
    open: base,
    high: base + Math.random() * 10,
    low: base - Math.random() * 10,
    close: base + Math.random() * 5 - 2,
  };
});
