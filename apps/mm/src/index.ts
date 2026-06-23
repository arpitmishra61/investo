import axios from "axios";

const BASE_URL = "http://localhost:8000";
const USER_ID = "5";

type MarketState = {
  market: string;
  price: number;
  volatility: number;
  intervalMs: number;
};

const markets: MarketState[] = [
  { market: "GOOGLE_INR", price: 14000, volatility: 25, intervalMs: 3000 },
  { market: "META_INR", price: 32000, volatility: 60, intervalMs: 5000 },
];

async function placeOrder(
  market: string,
  price: number,
  quantity: number,
  side: "buy" | "sell",
) {
  try {
    await axios.post(`${BASE_URL}/api/v1/order`, {
      market,
      price: price.toFixed(1).toString(),
      quantity: quantity.toFixed(2).toString(),
      side,
      userId: USER_ID,
    });
  } catch (err: any) {
    console.log(`order failed for ${market}`, err?.response?.data ?? err.message);
  }
}

async function tick(state: MarketState) {
  // random walk so candles get real movement instead of a flat line
  state.price += (Math.random() - 0.5) * state.volatility;
  if (state.price < 1) state.price = 1;

  const spread = state.price * 0.0015;
  const qty = 0.5 + Math.random() * 2;

  // resting orders around the new price, building book depth
  const bidPrice = state.price - spread - Math.random() * spread;
  const askPrice = state.price + spread + Math.random() * spread;

  await placeOrder(state.market, bidPrice, qty, "buy");
  await placeOrder(state.market, askPrice, qty, "sell");

  // occasional crossing order so trades actually fill (otherwise the book
  // just grows resting orders with no kline data behind it)
  if (Math.random() < 0.6) {
    const crossSide = Math.random() < 0.5 ? "buy" : "sell";
    const crossPrice =
      crossSide === "buy" ? state.price + spread * 2 : state.price - spread * 2;
    await placeOrder(state.market, crossPrice, 0.3 + Math.random() * 1, crossSide);
  }

  console.log(`${state.market} tick @ ${state.price.toFixed(2)}`);
}

function startMarket(state: MarketState) {
  tick(state);
  setInterval(() => tick(state), state.intervalMs);
}

function main() {
  for (const state of markets) {
    startMarket(state);
  }
}

main();
