
"use client"

import { Card } from "@/components/ui/card";
import { PercentCircle, DecimalsArrowLeftIcon, FilesIcon, Bitcoin } from "lucide-react";
import type { LucideIcon } from "lucide-react";


import { Ticker } from "@repo/types/ticker";
import { useEffect, useState } from 'react'
import axios from "axios";
import { SignalingManager } from "./../../lib/SignalManager"

const BASE_URL = "http://localhost:8000";
const getTicker = async (symbol: string): Promise<Ticker> => {
    const res = await axios.get(`${BASE_URL}/api/v1/tickers/?symbol=${symbol}`)
    return res.data
}
export function TopBar() {

    const [ticker, setTicker] = useState<Ticker | null>()
    const market = "TATA_INR"
    useEffect(() => {
        getTicker(market).then(setTicker);
        SignalingManager.getInstance().registerCallback("ticker", (data: Omit<Ticker, "trades">) => setTicker(prevTicker => ({
            firstPrice: data?.firstPrice ?? prevTicker?.firstPrice ?? '',
            high: data?.high ?? prevTicker?.high ?? '',
            lastPrice: data?.lastPrice ?? prevTicker?.lastPrice ?? '',
            low: data?.low ?? prevTicker?.low ?? '',
            priceChange: data?.priceChange ?? prevTicker?.priceChange ?? '',
            priceChangePercent: data?.priceChangePercent ?? prevTicker?.priceChangePercent ?? '',
            quoteVolume: data?.quoteVolume ?? prevTicker?.quoteVolume ?? '',
            symbol: data?.symbol ?? prevTicker?.symbol ?? '',
            volume: data?.volume ?? prevTicker?.volume ?? '',
        })), `TICKER-${market}`);
        SignalingManager.getInstance().sendMessage({ "method": "SUBSCRIBE", "params": [`ticker.${market}`] });

        return () => {
            SignalingManager.getInstance().deRegisterCallback("ticker", `TICKER-${market}`);
            SignalingManager.getInstance().sendMessage({ "method": "UNSUBSCRIBE", "params": [`ticker.${market}`] });
        }
    }, [market])




    if (ticker)
        return (
            <Card className="flex flex-col md:flex-row items-center justify-between px-6 py-4 gap-4 md:gap-0 w-250 m-auto mb-7">
                {/* Left side: symbol + price */}
                <div className="flex gap-8">
                    <Bitcoin />
                    <>
                        <h1 className="text-xl font-semibold">{ticker.symbol}</h1>
                        <p className={`text-2xl font-bold ${+ticker.priceChange >= 0 ? "text-green-600" : "text-red-600"}`}>
                            ${ticker.lastPrice.toLocaleString()}
                        </p>
                    </>
                </div>

                {/* Right side: stats */}
                <div className="flex gap-8 text-sm">
                    <Stat label="24h Chg" value={`${ticker.priceChangePercent}%`} Icon={DecimalsArrowLeftIcon} />
                    <Stat label="Volume" value={`$${ticker.volume.toLocaleString()}`} Icon={FilesIcon} />
                    <Stat label="24h Low" value={ticker.low} Icon={PercentCircle} />

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
