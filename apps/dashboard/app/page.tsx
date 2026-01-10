import { TopBar } from "@/app/components/Topbar";
import { OrderBook } from "@/app/components/orderBook";
import { PriceChart } from "@/app/components/chart/priceChart";
import { Logo } from "./components/Logo";
import { TradingOrderForm } from "./components/TradeBox";
import { ChartCandlestick, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
Button
export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between">
        <Logo />
        <div className="flex gap-4 items-center">

          <Link href="/orders" className="inline-flex items-center gap-2 rounded-md border bg-grey border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition">
            <ChartCandlestick /> Open Orders
          </Link>
          <UserCircle />

        </div>

      </div>

      {/* <TopBar /> */}

      <div className="grid grid-cols-12 gap-4">
        <div className="col-span-6">
          <PriceChart />
        </div>
        <div className="col-span-3">
          <OrderBook />
        </div>
        <div className="col-span-3">
          <TradingOrderForm />
        </div>
      </div>
    </div>
  );
}
