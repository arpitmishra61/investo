
import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { GET_DEPTH } from "../types";

export const depthRouter = Router();

depthRouter.get("/", async (req, res) => {
    const { symbol } = req.query;
    const response = await RedisManager.getInstance().sendAndAwait({
        type: GET_DEPTH,
        data: {
            market: symbol as string
        }
    });
console.log("response", response.payload.asks)
    res.json(response.payload);
});
