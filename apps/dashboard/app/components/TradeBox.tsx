"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import axios from "axios"
import { toast } from "sonner"
import { Spinner } from "@/components/ui/spinner";
import { Loader } from "lucide-react";
import { SignalingManager } from "@/lib/SignalManager";
enum Execute {
    DONE = "DONE",
    PENDING = "PENDING"
}
type Balance = {
    available: number;
    locked: number;
};

type AccountBalances = {
    INR: Balance;
    TATA: Balance;
};
export function TradingOrderForm() {
    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [orderType, setOrderType] = useState<"limit" | "market" | "conditional">("limit");
    const [price, setPrice] = useState("87547.5");
    const [quantity, setQuantity] = useState("0");
    const [execute, setExecute] = useState<Execute>(Execute.DONE);
    const [balance, setBalance] = useState<AccountBalances | null>(null);


    useEffect(() => {
        axios.get<AccountBalances>("http://localhost:8000/api/v1/balance?userId=5").then(res => {
            setBalance(res.data)
        })
        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`balance@5`] });
        SignalingManager.getInstance().registerCallback("balance", (updatedBalance: AccountBalances) => {
            console.log(updatedBalance)
            setBalance(updatedBalance)
        }, `BALANCE-${5}`);
    }, [])



    const orderValue = (parseFloat(price) || 0) * (parseFloat(quantity) || 0);

    return (
        <Card className="bg-white p-4 sm:p-6 rounded-xl w-full max-w-md mx-auto gap-3 border-zinc-200 shadow-md">
            {/* Buy / Sell Tabs */}
            <div className="flex gap-2 mb-4 rounded-lg bg-zinc-100 p-1 text-sm font-semibold">
                <button
                    className={`flex-1 py-2 rounded-md transition-colors ${side === "buy" ? "bg-green-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                    onClick={() => setSide("buy")}
                    aria-pressed={side === "buy"}
                >
                    Buy
                </button>
                <button
                    className={`flex-1 py-2 rounded-md transition-colors ${side === "sell" ? "bg-red-600 text-white shadow-sm" : "text-zinc-500 hover:text-zinc-700"
                        }`}
                    onClick={() => setSide("sell")}
                    aria-pressed={side === "sell"}
                >
                    Sell
                </button>
            </div>

            {/* Order Type Tabs */}
            <Tabs value={orderType} onValueChange={setOrderType} className="mb-4 w-4/5 m-auto">
                <TabsList className="bg-zinc-100 rounded-lg p-1 text-sm font-semibold w-full">
                    <TabsTrigger value="limit" className="px-4 py-2 rounded-md data-[state=active]:shadow-sm">
                        Limit
                    </TabsTrigger>
                    <TabsTrigger value="market" className="px-4 py-2 rounded-md data-[state=active]:shadow-sm">
                        Market
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Available Equity */}
            <div className="text-xs text-zinc-500 bg-zinc-50 rounded-md px-3 py-2 border border-zinc-100">Available Money: <span className="font-medium text-zinc-700">INR {balance ? balance.INR.available.toPrecision(9) : <Loader />}</span></div>
            <div className="flex gap-2">
                {/* Price Input */}
                <div className="flex-1 min-w-0">
                    <Label htmlFor="price" className="text-zinc-500 text-xs">
                        Price
                    </Label>
                    <div className="relative">
                        <Input
                            id="price"

                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="pr-10 bg-zinc-50 border-zinc-200 w-full"
                        />


                    </div>
                </div>

                <div className="flex-1 min-w-0">
                    {/* Quantity Input */}
                    <Label htmlFor="quantity" className="text-zinc-500 text-xs">
                        Quantity
                    </Label>
                    <div className="relative ">
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="pr-10 bg-zinc-900 text-white border-zinc-900 w-full"
                        />

                    </div>
                </div>
            </div>

            {/* Order Value */}
            <Label className="text-zinc-500 text-xs">Order Value</Label>
            <div className="flex items-center bg-zinc-900 rounded-md px-3 py-2.5">
                <span className="text-white font-medium">₹{orderValue.toFixed(2)}</span>
            </div>
            {/* Button */}
            <div>
                <Label htmlFor="pin" className="text-zinc-500 text-xs mb-1 block">Security PIN</Label>
                <Input
                    id="pin"
                    placeholder="Enter the Pin"
                    type="password"
                    className="pr-10 bg-zinc-50 border-zinc-200 text-black"
                />
            </div>
            <button
                className={`flex-1 py-2.5 rounded-md mt-1 font-semibold transition-colors ${side === "buy" ? "bg-green-600 hover:bg-green-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"
                    }`}
                onClick={async () => {
                    const url = 'http://localhost:8000/api/v1/order';

                    const payload = {
                        market: 'TATA_INR',
                        price,
                        quantity,
                        side,
                        userId: '5',
                    };

                    try {
                        setExecute(Execute.PENDING)
                        const response = await axios.post(url, payload, {
                            headers: {
                                'Content-Type': 'application/json',
                            },
                        });
                        const { executedQty, rQuantity } = response.data
                        toast.success("Trade done successfully ✅", {
                            description: `Executed quantity ${executedQty}. Remaning Quantity ${rQuantity}`,
                            className: "trade-success-toast",
                        })

                    } catch (error) {
                        toast.error("Error !!! ❌", {
                            description: "Some error.",
                            className: "trade-error-toast",
                        })
                    }
                    finally {
                        setExecute(Execute.DONE)
                    }

                }}
            >
                <div className="flex px-4 gap-4"> Execute The {side === "buy" ? "Buy" : "Sell"} {execute === "PENDING" && <Spinner className="mt-1" />}</div>
            </button>
        </Card>
    );
}
