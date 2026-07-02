"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_URL } from "@/lib/config";

interface Props {
  market: string;
  children: React.ReactNode;
}

// Waits for the first kline data to arrive before revealing the market UI.
// This gives the MM time to warm the orderbook before the user sees it.
export function MarketLoader({ market, children }: Props) {
  const [ready, setReady] = useState(false);
  const [dots, setDots] = useState(".");

  useEffect(() => {
    // Animate the loading dots
    const dotTimer = setInterval(() => {
      setDots((d) => (d.length >= 3 ? "." : d + "."));
    }, 500);

    // Poll klines endpoint — once we get data the market is ready
    const endTime = Date.now();
    const startTime = endTime - 24 * 60 * 60 * 1000;

    const poll = setInterval(async () => {
      try {
        const res = await fetch(
          `${API_URL}/api/v1/klines?market=${market}&interval=1m&startTime=${startTime}&endTime=${endTime}`,
        );
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setReady(true);
          clearInterval(poll);
          clearInterval(dotTimer);
        }
      } catch {
        // API not up yet, keep polling
      }
    }, 1000);

    return () => {
      clearInterval(poll);
      clearInterval(dotTimer);
    };
  }, [market]);

  if (ready) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-50">
      <div className="flex flex-col items-center gap-6 rounded-2xl border border-zinc-200 bg-white px-12 py-10 shadow-xl">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-zinc-100">
          <Loader2 className="h-7 w-7 animate-spin text-zinc-600" />
        </div>
        <div className="text-center">
          <p className="text-lg font-semibold text-zinc-800">Market Opening{dots}</p>
          <p className="mt-1 text-sm text-zinc-500">
            {market.replace("_", " / ")} is warming up
          </p>
        </div>
        <div className="flex gap-1">
          {[0, 1, 2, 3, 4].map((i) => (
            <span
              key={i}
              className="h-1.5 w-6 rounded-full bg-zinc-200 overflow-hidden relative"
            >
              <span
                className="absolute inset-0 bg-zinc-800 rounded-full animate-pulse"
                style={{ animationDelay: `${i * 150}ms` }}
              />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
