import { TopBar } from "@/app/components/Topbar";
import { OrderBook } from "@/app/components/orderBook";
import { PriceChart } from "@/app/components/chart/priceChart";
import { Logo } from "./components/Logo";
import { TradingOrderForm } from "./components/TradeBox";

export default function Page() {
  return (
    <div className="p-6 space-y-4">
      <Logo />
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
