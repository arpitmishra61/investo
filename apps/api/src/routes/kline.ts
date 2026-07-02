import { Router } from "express";
import prisma from "@repo/database";
import "dotenv/config";

export const klineRouter = Router();

klineRouter.get("/", async (req, res) => {
  const { market, interval, startTime, endTime } = req.query as any;
  console.log(market, interval, startTime, endTime);
  const bucket = {
    gte: new Date(+startTime as unknown as string),
    lte: new Date(+endTime as unknown as string),
  };

  try {
    let rows;
    if (interval === "1m") {
      rows = await prisma.kline1m.findMany({
        where: { market, bucket },
        orderBy: { bucket: "asc" },
      });
      console.log("rows", rows);
    } else if (interval === "1h") {
      rows = await prisma.kline1h.findMany({
        where: { market, bucket },
        orderBy: { bucket: "asc" },
      });
    } else if (interval === "3s") {
      rows = await prisma.kline3s.findMany({
        where: { market, bucket },
        orderBy: { bucket: "asc" },
      });
    } else {
      return res.status(400).send("Invalid interval");
    }

    res.json(
      rows.map((x) => ({
        close: x.close,
        time: Math.floor(x.bucket.getTime() / 1000),
        high: x.high,
        low: x.low,
        open: x.open,
      })),
    );
  } catch (err) {
    console.log(err);
    res.status(500).send(err);
  }
});
