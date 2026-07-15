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

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

app.use("/api/v1/order", orderRateLimit, orderRouter);
app.use("/api/v1/depth", readRateLimit, depthRouter);
app.use("/api/v1/trades", readRateLimit, tradesRouter);
app.use("/api/v1/klines", readRateLimit, klineRouter);
app.use("/api/v1/tickers", readRateLimit, tickersRouter);
app.use("/api/v1/balance", readRateLimit, balanceRouter);
app.use("/api/v1/auth", strictRateLimit, authRouter);
app.use("/api/v1/admin", strictRateLimit, adminRouter);

app.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
});
