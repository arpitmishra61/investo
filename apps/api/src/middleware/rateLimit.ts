import rateLimit from "express-rate-limit";
import { AuthedRequest } from "./auth";

// Read-heavy endpoints (ticker, kline, balance) — generous limit, protects DB from scraping/polling abuse.
export const readRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// The market maker's fixed service-account user id (apps/mm/src/index.ts's USER_ID).
// It legitimately places far more orders per minute than any real trader (multiple
// markets ticking every few seconds), so it's exempt from orderRateLimit below rather
// than sized into the same shared bucket as real users.
const MM_USER_ID = "3";

// Order placement/cancellation — stricter limit, protects the matching engine from
// spam from real users/external clients. Requires requireAuth to run first (see
// index.ts) so req.userId is available here to skip the MM's own traffic.
export const orderRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  skip: (req) => (req as AuthedRequest).userId === MM_USER_ID,
});

// Auth/admin — tightest limit, these are brute-force/abuse-sensitive.
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
