import { TopBar } from "@/app/components/Topbar";
import { OrderBook } from "@/app/components/orderBook";
import { PriceChart } from "@/app/components/chart/priceChart";
import { TradingOrderForm } from "@/app/components/TradeBox";
import { MarketLoader } from "@/app/components/MarketLoader";
import { TradeSessionGuard } from "@/app/components/TradeSessionGuard";
import { MarketNav } from "@/app/components/MarketNav";

const SYMBOL_TO_MARKET: Record<string, string> = {
    google: "GOOGLE_INR",
    meta: "META_INR",
};

export default async function Page({ params }: { params: Promise<{ symbol: string }> }) {
    const { symbol } = await params;
    const market = SYMBOL_TO_MARKET[symbol.toLowerCase()] ?? "GOOGLE_INR";
    return (
        <TradeSessionGuard market={market}>
            <div className="min-h-screen bg-background text-foreground">
                <MarketLoader market={market}>
                    <div className="p-3 sm:p-6 space-y-5 max-w-[1400px] m-auto">
                        <MarketNav />
                        <TopBar market={market} />
                        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                            <div className="lg:col-span-6">
                                <PriceChart market={market} />
                            </div>
                            <div className="lg:col-span-3">
                                <OrderBook symbol={market} />
                            </div>
                            <div className="lg:col-span-3">
                                <TradingOrderForm market={market} />
                            </div>
                        </div>
                    </div>
                </MarketLoader>
            </div>
        </TradeSessionGuard>
    );
}
