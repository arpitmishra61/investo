"use client";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TrendingUpIcon, ArrowUpRight } from "lucide-react";
import { Sparkline } from "@/app/components/sparkline";
import { MarketRow } from "@/lib/market";
import { ThemeToggle } from "@/app/components/ThemeToggle";

const MARKETS = [
  { market: "GOOGLE_INR", symbol: "GOOGLE", icon: "/google_logo.svg" },
  { market: "META_INR", symbol: "META", icon: "/meta_logo.svg" },
];

export default function MarketsPage() {
  const [markets, setMarkets] = useState<MarketRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    Promise.all(
      MARKETS.map((m) =>
        axios
          .get<{ result: MarketRow }>(`http://localhost:8000/api/v1/tickers/?market=${m.market}`)
          .then((res) => ({ ...res.data.result, symbol: m.symbol }))
      )
    )
      .then((results) => { setMarkets(results); setLoading(false); })
      .catch((err) => { console.log(err); setLoading(false); });
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 sm:px-10 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black">
            <TrendingUpIcon size={16} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trade<span className="text-emerald-500">Pi</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/orders"
            className="rounded-full border border-border bg-muted px-4 py-2 text-xs font-medium text-muted-foreground hover:text-foreground hover:border-foreground/20 transition-all"
          >
            Open Orders
          </Link>
        </div>
      </nav>

      <main className="mx-auto max-w-5xl px-4 sm:px-6 py-14">
        {/* Header */}
        <div className="mb-10">
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">Markets</h1>
          <p className="mt-2 text-sm text-muted-foreground">Select a market to start trading</p>
        </div>

        {/* Desktop table */}
        <div className="hidden sm:block">
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            {/* Table head */}
            <div className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] px-6 py-3.5 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-widest">
              <span>Name</span>
              <span>Price</span>
              <span>24h Volume</span>
              <span>Open 24h</span>
              <span>24h Change</span>
              <span className="text-right">7 Days</span>
            </div>

            {loading
              ? Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className="grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] px-6 py-5 border-b border-border last:border-0 animate-pulse gap-4">
                    {Array.from({ length: 6 }).map((_, j) => (
                      <div key={j} className="h-4 rounded bg-muted w-3/4" />
                    ))}
                  </div>
                ))
              : markets?.map((m) => {
                  const meta = MARKETS.find((x) => x.symbol === m.symbol)!;
                  const isNeg = (m.priceChangePercent24h ?? 0) < 0;
                  return (
                    <div
                      key={m.symbol}
                      onClick={() => router.push(`/market/${m.symbol.toLowerCase()}`)}
                      className="group grid grid-cols-[2fr_1fr_1fr_1fr_1fr_80px] items-center px-6 py-5 border-b border-border last:border-0 cursor-pointer hover:bg-accent/50 transition-colors"
                    >
                      {/* Name */}
                      <div className="flex items-center gap-3">
                        <div className="relative h-8 w-8 overflow-hidden rounded-full ring-1 ring-border bg-white flex items-center justify-center">
                          <Image src={meta.icon} fill alt={m.symbol} className="object-contain p-0.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{m.symbol}</div>
                          <div className="text-xs text-muted-foreground">{m.symbol}_INR</div>
                        </div>
                        <ArrowUpRight size={14} className="ml-1 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>

                      <div className="font-mono font-semibold text-sm">
                        ₹{(m.lastPrice ?? 0).toLocaleString("en-IN")}
                      </div>
                      <div className="text-sm text-muted-foreground">{m.volume24h}</div>
                      <div className="text-sm text-muted-foreground">{m.open24h}</div>
                      <div className={`text-sm font-semibold ${isNeg ? "text-red-500" : "text-emerald-500"}`}>
                        {isNeg ? "" : "+"}{(m.priceChangePercent24h ?? 0).toPrecision(4)}%
                      </div>
                      <div className="flex justify-end">
                        <Sparkline data={[11, 20, 31, 41, 51]} negative={m.priceChange24h < 0} />
                      </div>
                    </div>
                  );
                })}
          </div>
        </div>

        {/* Mobile cards */}
        <div className="sm:hidden space-y-3">
          {loading
            ? Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card p-5 animate-pulse h-24" />
              ))
            : markets?.map((m) => {
                const meta = MARKETS.find((x) => x.symbol === m.symbol)!;
                const isNeg = (m.priceChangePercent24h ?? 0) < 0;
                return (
                  <div
                    key={m.symbol}
                    onClick={() => router.push(`/market/${m.symbol.toLowerCase()}`)}
                    className="rounded-2xl border border-border bg-card p-5 cursor-pointer hover:bg-accent/50 transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="relative h-9 w-9 overflow-hidden rounded-full ring-1 ring-border bg-white flex items-center justify-center">
                          <Image src={meta.icon} fill alt={m.symbol} className="object-contain p-0.5" />
                        </div>
                        <div>
                          <div className="font-semibold text-sm">{m.symbol}</div>
                          <div className={`text-xs font-medium ${isNeg ? "text-red-500" : "text-emerald-500"}`}>
                            {isNeg ? "" : "+"}{(m.priceChangePercent24h ?? 0).toPrecision(4)}%
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-mono font-semibold">₹{(m.lastPrice ?? 0).toLocaleString("en-IN")}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">Vol: {m.volume24h}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
        </div>
      </main>
    </div>
  );
}
