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
        <Card className="bg-white p-6 rounded-md w-full max-w-md gap-3">
            {/* Buy / Sell Tabs */}
            <div className="flex gap-2 mb-4 rounded-md bg-zinc-200 p-1 text-sm font-semibold">
                <button
                    className={`flex-1 py-2 rounded-md ${side === "buy" ? "bg-green-700 text-green-300" : "text-zinc-400"
                        }`}
                    onClick={() => setSide("buy")}
                    aria-pressed={side === "buy"}
                >
                    Buy
                </button>
                <button
                    className={`flex-1 py-2 rounded-md ${side === "sell" ? "bg-red-600 text-red-200" : "text-zinc-400"
                        }`}
                    onClick={() => setSide("sell")}
                    aria-pressed={side === "sell"}
                >
                    Sell
                </button>
            </div>

            {/* Order Type Tabs */}
            <Tabs value={orderType} onValueChange={setOrderType} className="mb-6 w-4/5 m-auto">
                <TabsList className="bg-zinc-200 rounded-md p-1 text-sm font-semibold w-full">
                    <TabsTrigger value="limit" className="px-4 py-2 rounded-md">
                        Limit
                    </TabsTrigger>
                    <TabsTrigger value="market" className="px-4 py-2 rounded-md">
                        Market
                    </TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Available Equity */}
            <div className="text-xs text-zinc-500">Available Money INR {balance ? balance.INR.available.toPrecision(9) : <Loader />}</div>
            <div className="flex gap-2">
                {/* Price Input */}
                <div>
                    <Label htmlFor="price" className="text-zinc-400 text-xs">
                        Price
                    </Label>
                    <div className="relative">
                        <Input
                            id="price"

                            value={price}
                            onChange={(e) => setPrice(e.target.value)}
                            className="pr-10 bg-zinc-200"
                        />


                    </div>
                </div>

                <div>
                    {/* Quantity Input */}
                    <Label htmlFor="quantity" className="text-zinc-400 text-xs">
                        Quantity
                    </Label>
                    <div className="relative ">
                        <Input
                            id="quantity"
                            type="number"
                            value={quantity}
                            onChange={(e) => setQuantity(e.target.value)}
                            className="pr-10 bg-zinc-900 text-white"
                        />

                    </div>
                </div>
            </div>

            {/* Order Value */}
            <Label className="text-zinc-400 text-xs">Order Value</Label>
            <div className="flex items-center bg-zinc-900 rounded-md px-3 py-2">
                <span className="text-white">₹{orderValue.toFixed(2)}</span>
            </div>
            {/* Button */}
            <Input
                placeholder="Enter the Pin"

                className="pr-10 bg-zinc-200 text-black mt-12"
            />
            <button
                className={`flex-1 py-2 rounded-md mt-1 ${side === "buy" ? "bg-green-700 text-green-300" : "text-red-200 bg-red-600"
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
