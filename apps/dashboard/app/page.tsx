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
import { markets } from "@/lib/market";
import { Logo } from "./components/Logo";
import { redirect } from "next/navigation";

export default function MarketsTable() {
  return (
    <div className="rounded-xl border bg-background p-4 max-w-[800] m-auto mt-6">
      <Logo />
      <Table className="mt-4">
        <TableHeader>
          <TableRow className="text-muted-foreground">
            <TableHead>Name</TableHead>
            <TableHead>Price</TableHead>
            <TableHead>24h Volume</TableHead>
            <TableHead>Open Interest</TableHead>
            <TableHead>24h Change</TableHead>
            <TableHead className="text-right">Last 7 Days</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {markets.map((m) => (
            <TableRow key={m.symbol} onClick={() => {
              redirect("/dashboard/tata")

            }}>
              <TableCell className="flex items-center gap-3">
                <span className="text-xl">{m.icon}</span>
                <span className="font-medium">{m.symbol}</span>
              </TableCell>

              <TableCell className="font-semibold">
                ${m.price.toLocaleString()}
              </TableCell>

              <TableCell>{m.volume24h}</TableCell>

              <TableCell>{m.openInterest}</TableCell>

              <TableCell
                className={
                  m.change24h < 0 ? "text-red-500" : "text-green-500"
                }
              >
                {m.change24h}%
              </TableCell>

              <TableCell className="flex justify-end">
                <Sparkline
                  data={m.sparkline}
                  negative={m.change24h < 0}
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
