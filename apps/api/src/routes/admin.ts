import { Router } from "express";
import { RedisManager } from "../RedisManager";
import { RESET_ENGINE } from "../types";

export const adminRouter = Router();

// POST /api/v1/admin/reset — wipes engine orderbooks and re-seeds balances.
// Requires the x-admin-key header to match ADMIN_KEY when it is set.
adminRouter.post("/reset", async (req, res) => {
  const adminKey = process.env.ADMIN_KEY;
  if (adminKey && req.headers["x-admin-key"] !== adminKey) {
    res.status(401).json({ error: "Unauthorized" });
    return;
  }

  const response = await RedisManager.getInstance().sendAndAwait({
    type: RESET_ENGINE,
    data: {},
  });
  res.json(response.payload);
});
