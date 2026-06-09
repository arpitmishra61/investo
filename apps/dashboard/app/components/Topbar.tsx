
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

const getTicker = async (symbol: string): Promise<Ticker> => {
    const res = await axios.get(`${BASE_URL}/api/v1/tickers/?symbol=${symbol}`)
    return res.data.result
}

export function TopBar() {

    const [ticker, setTicker] = useState<Ticker | null>()
    const market = "TATA_INR"
    useEffect(() => {

        SignalingManager.getInstance().registerCallback("ticker", (data: Omit<Ticker, "trades">) => setTicker(prevTicker => ({
            lastPrice: data.lastPrice,
            low24h: data.low24h,
            high24h: data.high24h,
            volume24h: data.volume24h,
            open24h: data.open24h,
            priceChange24h: data.priceChange24h,
            priceChangePercent24h: data.high24h,
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
            <Card className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 md:gap-0 w-250 m-auto mb-7">
                {/* Left side: symbol + price */}
                <div className="flex gap-8">
                    <Image src="/tata_logo.jpg" height={60} width={60} alt="tata_logo" />
                    <>
                        <h1 className="text-xl font-semibold">{"TATA_INR"}</h1>
                        <p className={`text-2xl font-bold ${+ticker.priceChange24h >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ₹ {ticker.lastPrice.toLocaleString()}
                        </p>
                    </>
                </div>

                {/* Right side: stats */}
                <div className="flex gap-8 text-sm">
                    <Stat label="24h Change" value={`${ticker.priceChangePercent24h.toPrecision(4)}%`} Icon={ClockFading} />
                    <Stat label="Volume" value={`${ticker.volume24h.toLocaleString()}`} Icon={ChartColumnStacked} />
                    <Stat label="24h Low" value={"₹" + ticker.low24h} Icon={ArrowDownLeft} />

                    <Stat label="24h High" value={"₹" + ticker.high24h} Icon={ArrowUpRight} />

                </div>
            </Card>
        );
}

function Stat({ label, value, Icon }: { label: string; value: string | number; Icon: LucideIcon }) {
    return (
        <div className="flex flex-col items-center">
            <Icon className="h-5 w-5 text-muted-foreground mb-1" />
            <p className="text-muted-foreground text-xs">{label}</p>
            <p className="font-medium">{value}</p>
        </div>
    );
}
