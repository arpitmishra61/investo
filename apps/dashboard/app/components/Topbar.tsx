
"use client"

import { Card } from "@/components/ui/card";
import { PercentCircle, DecimalsArrowLeftIcon, FilesIcon, Bitcoin, IndianRupee, ArrowUpRight, ArrowDown, ArrowDownLeft, ClockFading, ChartColumnStacked } from "lucide-react";
import type { LucideIcon } from "lucide-react";


import { Ticker } from "@repo/types/ticker";
import { useEffect, useState } from 'react'
import axios from "axios";
import { SignalingManager } from "./../../lib/SignalManager"
import Image from "next/image";

const BASE_URL = "http://localhost:8000";

const getTicker = async (market: string): Promise<Ticker> => {
    const res = await axios.get(`${BASE_URL}/api/v1/tickers/?market=${market}`)
    return res.data.result
}

export function TopBar({ market = "TATA_INR" }: { market?: string }) {

    const [ticker, setTicker] = useState<Ticker | null>()
    useEffect(() => {
        setTicker(null)

        SignalingManager.getInstance().registerCallback("ticker", (data: Omit<Ticker, "trades">) => setTicker(prevTicker => ({
            lastPrice: data.lastPrice,
            low24h: data.low24h,
            high24h: data.high24h,
            volume24h: data.volume24h,
            open24h: data.open24h,
            priceChange24h: data.priceChange24h,
            priceChangePercent24h: data.priceChangePercent24h,
        })), `TICKER-${market}`);
        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`ticker@${market}`] });
        //currently doing the loop not in ws
        setInterval(() => {
            getTicker(market).then(setTicker).catch(err => console.log("err", err))
        }, 5000)

        return () => {
            SignalingManager.getInstance().deRegisterCallback("ticker", `TICKER-${market}`);
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`ticker@${market}`] });
        }
    }, [market])



    if (ticker)
        return (
            <Card className="flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 py-4 gap-4 md:gap-0 w-full max-w-[1000px] m-auto mb-2 border-zinc-200 shadow-md">
                {/* Left side: symbol + price */}
                <div className="flex items-center gap-4 sm:gap-8">
                    <div className="rounded-xl overflow-hidden ring-1 ring-zinc-200 shadow-sm">
                        {market === "TATA_INR" ? (
                            <Image src="/tata_logo.jpg" height={60} width={60} alt={market} className="h-12 w-12 sm:h-15 sm:w-15 object-cover" />
                        ) : (
                            <div className="flex h-12 w-12 sm:h-15 sm:w-15 items-center justify-center bg-zinc-100 text-sm font-semibold text-zinc-600">
                                {market.slice(0, 1)}
                            </div>
                        )}
                    </div>
                    <div>
                        <h1 className="text-lg sm:text-xl font-semibold tracking-tight">{market}</h1>
                        <p className={`text-xl sm:text-2xl font-bold ${+ticker.priceChange24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ₹ {ticker.lastPrice.toLocaleString()}
                        </p>
                    </div>
                </div>

                {/* Right side: stats */}
                <div className="flex flex-nowrap justify-center gap-1.5 sm:gap-3 text-sm w-full md:w-auto overflow-x-auto">
                    <Stat label="24h Change" value={`${(ticker.priceChangePercent24h ?? 0).toPrecision(4)}%`} Icon={ClockFading} />
                    <Stat label="Volume" value={`${ticker.volume24h.toLocaleString()}`} Icon={ChartColumnStacked} />
                    <Stat label="24h Low" value={"₹" + ticker.low24h} Icon={ArrowDownLeft} />

                    <Stat label="24h High" value={"₹" + ticker.high24h} Icon={ArrowUpRight} />

                </div>
            </Card>
        );
}

function Stat({ label, value, Icon }: { label: string; value: string | number; Icon: LucideIcon }) {
    return (
        <div className="flex flex-col items-center gap-1 rounded-lg bg-zinc-50 px-2 sm:px-3 py-2 min-w-[72px] sm:min-w-[88px] flex-shrink-0 border border-zinc-100">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground text-[10px] sm:text-[11px] leading-none whitespace-nowrap">{label}</p>
            <p className="font-semibold text-xs sm:text-sm leading-none whitespace-nowrap">{value}</p>
        </div>
    );
}
