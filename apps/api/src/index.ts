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

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors());
app.use(express.json());

app.use("/api/v1/order", orderRouter);
app.use("/api/v1/depth", depthRouter);
app.use("/api/v1/trades", tradesRouter);
app.use("/api/v1/klines", klineRouter);
app.use("/api/v1/tickers", tickersRouter);
app.use("/api/v1/balance", balanceRouter);
app.use("/api/v1/auth", authRouter);
app.use("/api/v1/admin", adminRouter);

app.listen(PORT, () => {
  console.log("Server is running on port ", PORT);
});
