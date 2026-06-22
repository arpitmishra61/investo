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

export default function MarketsTable() {
  const [markets, setMarkets] = useState<MarketRow[] | null>(null)
  console.log("markets", markets)
  useEffect(() => {
    axios.get<{ result: MarketRow }>(`http://localhost:8000/api/v1/tickers/?market=TATA_INR`).then(res => {
      console.log(res.data.result)
      setMarkets([res.data.result])
    }).catch(err => {
      console.log(err)
    })
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
              redirect("/dashboard/tata")

            }}>
              <TableCell className="flex items-center gap-3">
                <Image src="/tata_logo.jpg" width={30} height={30} alt="tata" />

                <span className="font-medium">{m.symbol ?? "TATA"}</span>
              </TableCell>

              <TableCell className="font-semibold">
                ₹ {m.lastPrice.toLocaleString()}
              </TableCell>

              <TableCell>{m.volume24h.toString()}</TableCell>

              <TableCell>{m.open24h}</TableCell>

              <TableCell
                className={
                  m.priceChangePercent24h < 0 ? "text-red-500" : "text-green-500"
                }
              >
                <strong> {m.priceChangePercent24h.toPrecision(4)}%</strong>
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
