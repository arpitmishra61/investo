"use client"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Sparkline } from "./components/sparkline";
import { MarketRow } from "@/lib/market";
import { Logo } from "./components/Logo";
import { redirect } from "next/navigation";
import { useEffect, useState } from "react";
import axios from "axios";
import Image from "next/image";

const MARKETS = [
  { market: "TATA_INR", symbol: "TATA", icon: "/tata_logo.jpg" },
  { market: "GOOGLE_INR", symbol: "GOOGLE", icon: null },
  { market: "META_INR", symbol: "META", icon: null },
];

export default function MarketsTable() {
  const [markets, setMarkets] = useState<MarketRow[] | null>(null)
  console.log("markets", markets)
  useEffect(() => {
    Promise.all(
      MARKETS.map((m) =>
        axios
          .get<{ result: MarketRow }>(`http://localhost:8000/api/v1/tickers/?market=${m.market}`)
          .then((res) => ({ ...res.data.result, symbol: m.symbol })),
      ),
    )
      .then((results) => setMarkets(results))
      .catch((err) => console.log(err))
  }, [])
  return (
    <div className="rounded-xl border bg-background p-4 max-w-[800px] m-auto mt-6 mx-3 sm:mx-auto">
      <Logo />
      <div className="overflow-x-auto">
      <Table className="mt-4">
        <TableHeader>
          <TableRow className="text-muted-foreground">
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>24h Volume</TableHead>
            <TableHead>Open 24h</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead className="text-right">Last 7 Days</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {markets && markets.map((m) => (
            <TableRow key={m.symbol} onClick={() => {
              redirect(`/dashboard/${m.symbol.toLowerCase()}`)

            }}>
              <TableCell className="flex items-center gap-3">
                {MARKETS.find((x) => x.symbol === m.symbol)?.icon ? (
                  <Image
                    src={MARKETS.find((x) => x.symbol === m.symbol)!.icon!}
                    width={30}
                    height={30}
                    alt={m.symbol}
                  />
                ) : (
                  <div className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-zinc-100 text-xs font-semibold text-zinc-600">
                    {m.symbol.slice(0, 1)}
                  </div>
                )}

                <span className="font-medium">{m.symbol ?? "TATA"}</span>
              </TableCell>

              <TableCell className="font-semibold">
                ₹ {(m.lastPrice ?? 0).toLocaleString()}
              </TableCell>

              <TableCell>{m.volume24h.toString()}</TableCell>

              <TableCell>{m.open24h}</TableCell>

              <TableCell
                className={
                  (m.priceChangePercent24h ?? 0) < 0 ? "text-red-500" : "text-green-500"
                }
              >
                <strong> {(m.priceChangePercent24h ?? 0).toPrecision(4)}%</strong>
              </TableCell>

              <TableCell className="flex justify-end">
                <Sparkline
                  data={[11, 20, 31, 41, 51]}
                  negative={m.priceChange24h < 0}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      </div>
    </div>
  );
}
