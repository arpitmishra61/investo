import { TopBar } from "@/app/components/Topbar";
import { OrderBook } from "@/app/components/orderBook";
import { PriceChart } from "@/app/components/chart/priceChart";
import { Logo } from "@/app/components/Logo";
import { TradingOrderForm } from "@/app/components/TradeBox";
import { ChartCandlestick, UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
Button
export default function Page() {
    return (
        <div className="min-h-screen bg-zinc-50">
            <div className="p-3 sm:p-6 space-y-5 max-w-[1400px] m-auto">
                <div className="flex justify-between items-center gap-2 flex-wrap">
                    <Logo />
                    <div className="flex gap-2 sm:gap-4 items-center">

                        <Link href="/orders" className="inline-flex items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 sm:px-4 py-2 text-sm font-medium text-zinc-700 shadow-sm hover:bg-zinc-100 hover:border-zinc-300 transition">
                            <ChartCandlestick className="h-5 w-5" /> <span className="hidden sm:inline">Open Orders</span>
                        </Link>
                        <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white border border-zinc-200 shadow-sm">
                            <UserCircle className="h-5 w-5 text-zinc-600" />
                        </div>

                    </div>

                </div>

                <TopBar />

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                    <div className="lg:col-span-6">
                        <PriceChart />
                    </div>
                    <div className="lg:col-span-3">
                        <OrderBook symbol="TATA_INR" />
                    </div>
                    <div className="lg:col-span-3">
                        <TradingOrderForm />
                    </div>
                </div>
            </div>
        </div>
    );
}
