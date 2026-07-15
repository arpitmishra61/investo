import rateLimit from "express-rate-limit";

// Read-heavy endpoints (ticker, kline, balance) — generous limit, protects DB from scraping/polling abuse.
export const readRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 40,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// Order placement/cancellation — stricter limit, protects the matching engine from spam.
export const orderRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});

// Auth/admin — tightest limit, these are brute-force/abuse-sensitive.
export const strictRateLimit = rateLimit({
  windowMs: 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
});
