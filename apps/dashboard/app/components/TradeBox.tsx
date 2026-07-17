"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from "axios";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { Loader } from "lucide-react";
import { SignalingManager } from "@/lib/SignalManager";
import { API_URL } from "@/lib/config";

enum Execute { DONE = "DONE", PENDING = "PENDING" }

type Balance = { available: number; locked: number };
type AccountBalances = Record<string, Balance>;

export function TradingOrderForm({ market = "TATA_INR" }: { market?: string }) {
    const router = useRouter();
    const [side, setSide] = useState<"buy" | "sell">("buy");
    const [orderType, setOrderType] = useState<"limit" | "market">("limit");
    const [price, setPrice] = useState("87547.5");
    const [priceTouched, setPriceTouched] = useState(false);
    const [quantity, setQuantity] = useState("0");
    const [execute, setExecute] = useState<Execute>(Execute.DONE);
    const [balance, setBalance] = useState<AccountBalances | null>(null);
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [userId, setUserId] = useState<string>("3");

    useEffect(() => {
        const raw = localStorage.getItem("user");
        if (raw) {
            const user = JSON.parse(raw);
            setUserId(user.id);
        }
        setIsAuthenticated(!!localStorage.getItem("token"));
    }, []);

    useEffect(() => {
        if (!userId || !isAuthenticated) {
            setBalance(null);
            return;
        }
        const token = localStorage.getItem("token");
        axios.get<AccountBalances>(`${API_URL}/api/v1/balance?userId=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        }).then(res => setBalance(res.data));
        SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`balance@${userId}`] });
        SignalingManager.getInstance().registerCallback("balance", (updated: AccountBalances) => setBalance(updated), `BALANCE-${userId}`);
        return () => {
            SignalingManager.getInstance().deRegisterCallback("balance", `BALANCE-${userId}`);
            SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`balance@${userId}`] });
        };
    }, [userId, isAuthenticated]);

    // reset "did the user manually edit the price" whenever market or order type changes,
    // so limit orders re-sync to the live price until the user types their own
    useEffect(() => {
        setPriceTouched(false);
    }, [market, orderType]);

    // read via refs inside the ticker callback instead of depending on them directly —
    // otherwise every keystroke (which flips priceTouched) would tear down and
    // re-send SUBSCRIBE/UNSUBSCRIBE on the shared WS connection, which also carries
    // Topbar's ticker feed
    const orderTypeRef = useRef(orderType);
    orderTypeRef.current = orderType;
    const priceTouchedRef = useRef(priceTouched);
    priceTouchedRef.current = priceTouched;

    useEffect(() => {
        SignalingManager.getInstance().registerCallback(
            "current_price",
            (currentPrice: number) => {
                setPrice((prev) => {
                    if (orderTypeRef.current === "market" || !priceTouchedRef.current) {
                        return currentPrice.toString();
                    }
                    return prev;
                });
            },
            `TRADEBOX-PRICE-${market}`,
        );
        SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`current_price@${market}`] });

        return () => {
            SignalingManager.getInstance().deRegisterCallback("current_price", `TRADEBOX-PRICE-${market}`);
            SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`current_price@${market}`] });
        };
    }, [market]);

    const orderValue = (parseFloat(price) || 0) * (parseFloat(quantity) || 0);
    const baseAsset = market.split("_")[0] ?? "";
    const insufficientBalance = side === "buy"
        ? orderValue > (balance?.INR?.available ?? 0)
        : (parseFloat(quantity) || 0) > (balance?.[baseAsset]?.available ?? 0);

    return (
        <Card className="p-4 sm:p-5 w-full max-w-md mx-auto space-y-4">
            {/* Buy / Sell */}
            <div className="flex gap-2 rounded-lg bg-muted p-1 text-sm font-semibold">
                <button
                    className={`flex-1 py-2 rounded-md transition-colors ${side === "buy" ? "bg-emerald-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setSide("buy")}
                >
                    Buy
                </button>
                <button
                    className={`flex-1 py-2 rounded-md transition-colors ${side === "sell" ? "bg-red-600 text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
                    onClick={() => setSide("sell")}
                >
                    Sell
                </button>
            </div>

            {/* Order Type */}
            <Tabs value={orderType} onValueChange={(v) => setOrderType(v as "limit" | "market")} className="w-4/5 mx-auto">
                <TabsList className="bg-muted rounded-lg p-1 text-sm font-semibold w-full">
                    <TabsTrigger value="limit" className="px-4 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Limit</TabsTrigger>
                    <TabsTrigger value="market" className="px-4 py-2 rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">Market</TabsTrigger>
                </TabsList>
            </Tabs>

            {/* Balance */}
            <div className="text-xs text-muted-foreground bg-muted/50 rounded-md px-3 py-2 border border-border">
                Available Money: <span className="font-semibold text-foreground">
                    {!isAuthenticated
                        ? "Sign in to view"
                        : `INR ${balance?.INR ? balance.INR.available.toPrecision(9) : ""}`}
                    {isAuthenticated && !balance?.INR && <Loader className="inline h-3 w-3 animate-spin" />}
                </span>
            </div>

            {/* Price + Quantity */}
            <div className="flex gap-3">
                <div className="flex-1 min-w-0">
                    <Label htmlFor="price" className="text-muted-foreground text-xs">Price</Label>
                    <Input
                        id="price"
                        value={price}
                        onChange={(e) => {
                            setPrice(e.target.value);
                            setPriceTouched(true);
                        }}
                        disabled={orderType === "market"}
                        className="mt-1 bg-background border-border disabled:opacity-70 disabled:cursor-not-allowed"
                    />
                </div>
                <div className="flex-1 min-w-0">
                    <Label htmlFor="quantity" className="text-muted-foreground text-xs">Quantity</Label>
                    <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(e.target.value)} className="mt-1 bg-background border-border" />
                </div>
            </div>

            {/* Order Value */}
            <div>
                <Label className="text-muted-foreground text-xs">Order Value</Label>
                <div className="mt-1 flex items-center bg-muted rounded-md px-3 py-2.5 border border-border">
                    <span className="font-mono font-semibold">₹{orderValue.toFixed(2)}</span>
                </div>
                {insufficientBalance && (
                    <p className="mt-1 text-xs text-red-500">
                        {side === "buy" ? "Insufficient balance" : `Insufficient ${baseAsset} balance`}
                    </p>
                )}
            </div>

            {/* PIN */}
            <div>
                <Label htmlFor="pin" className="text-muted-foreground text-xs">Security PIN</Label>
                <Input id="pin" placeholder="Enter the Pin" type="password" className="mt-1 bg-background border-border" />
            </div>

            {/* Submit */}
            {isAuthenticated ? (
                <button
                    disabled={execute === Execute.PENDING || insufficientBalance}
                    className={`w-full py-2.5 rounded-md font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${side === "buy" ? "bg-emerald-600 hover:bg-emerald-700 text-white" : "bg-red-600 hover:bg-red-700 text-white"}`}
                    onClick={async () => {
                        try {
                            setExecute(Execute.PENDING);
                            const token = localStorage.getItem("token");
                            const response = await axios.post(`${API_URL}/api/v1/order`, { market, price, quantity, side }, {
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                            });
                            const { executedQty, rQuantity } = response.data;
                            toast.success("Trade done successfully ✅", { description: `Executed: ${executedQty}  Remaining: ${rQuantity}`, className: "trade-success-toast" });
                        } catch (err) {
                            const message = axios.isAxiosError(err) ? err.response?.data?.error : undefined;
                            toast.error("Error ❌", { description: message ?? "Something went wrong.", className: "trade-error-toast" });
                        } finally {
                            setExecute(Execute.DONE);
                        }
                    }}
                >
                    <div className="flex items-center justify-center gap-3">
                        Execute The {side === "buy" ? "Buy" : "Sell"}
                        {execute === Execute.PENDING && <Spinner className="h-4 w-4" />}
                    </div>
                </button>
            ) : (
                <button
                    className="w-full py-2.5 rounded-md font-semibold transition-colors bg-muted border border-border text-foreground hover:bg-accent"
                    onClick={() => router.push("/signin")}
                >
                    Sign In to Trade
                </button>
            )}
        </Card>
    );
}
