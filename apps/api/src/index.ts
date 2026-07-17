import express from "express";
import cors from "cors";
import { orderRouter } from "./routes/order";
import { depthRouter } from "./routes/depth";
import { tradesRouter } from "./routes/trades";
import { klineRouter } from "./routes/kline";
import { tickersRouter } from "./routes/ticker";
import { balanceRouter } from "./routes/balance";
import { authRouter } from "./routes/auth";
import { adminRouter } from "./routes/admin";
import { readRateLimit, orderRateLimit, strictRateLimit } from "./middleware/rateLimit";
import { requireAuth } from "./middleware/auth";

const app = express();
const PORT = process.env.PORT || 8000;

// Prod traffic passes through exactly one reverse proxy (Caddy, see Caddyfile) before
// reaching here, so trust its X-Forwarded-For for req.ip — otherwise every real visitor
// behind Caddy shares one rate-limit bucket (Caddy's own container IP) instead of being
// limited per-visitor. Harmless in local dev: with no proxy in front, there's no
// X-Forwarded-For header to read, so req.ip just falls back to the raw socket address.
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());

// requireAuth first so orderRateLimit can read req.userId and skip the MM's own traffic
app.use("/api/v1/order", requireAuth, orderRateLimit, orderRouter);
app.use("/api/v1/depth", readRateLimit, depthRouter);
app.use("/api/v1/trades", readRateLimit, tradesRouter);
app.use("/api/v1/klines", readRateLimit, klineRouter);
app.use("/api/v1/tickers", readRateLimit, tickersRouter);
app.use("/api/v1/balance", readRateLimit, requireAuth, balanceRouter);
app.use("/api/v1/auth", strictRateLimit, authRouter);
app.use("/api/v1/admin", strictRateLimit, adminRouter);

app.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
});
