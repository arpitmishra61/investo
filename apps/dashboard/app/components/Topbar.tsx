
"use client"

import { Card } from "@/components/ui/card";
import { ArrowUpRight, ArrowDownLeft, ClockFading, ChartColumnStacked, Play, Pause } from "lucide-react";
import type { LucideIcon } from "lucide-react";

import { Ticker } from "@repo/types/ticker";
import { useEffect, useRef, useState } from 'react'
import axios from "axios";
import { SignalingManager } from "./../../lib/SignalManager"
import Image from "next/image";

const BASE_URL = "http://localhost:8000";
const IDLE_TIMEOUT_MS = 60_000;

const getTicker = async (market: string): Promise<Ticker> => {
    const res = await axios.get(`${BASE_URL}/api/v1/tickers/?market=${market}`)
    return res.data.result
}

export function TopBar({ market = "TATA_INR" }: { market?: string }) {
    const [ticker, setTicker] = useState<Ticker | null>()
    const [tradeStopped, setTradeStopped] = useState(false);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    function scheduleStop() {
        if (timerRef.current) clearTimeout(timerRef.current);
        timerRef.current = setTimeout(() => {
            SignalingManager.getInstance().stopMM(market);
            setTradeStopped(true);
        }, IDLE_TIMEOUT_MS);
    }

    function handleStopTrade() {
        SignalingManager.getInstance().stopMM(market);
        setTradeStopped(true);
        if (timerRef.current) { clearTimeout(timerRef.current); timerRef.current = null; }
    }

    useEffect(() => {
        setTicker(null);
        setTradeStopped(false);
        SignalingManager.getInstance().startMM(market);
        scheduleStop();

        SignalingManager.getInstance().registerCallback("ticker", (data: Omit<Ticker, "trades">) => setTicker(() => ({
            lastPrice: data.lastPrice,
            low24h: data.low24h,
            high24h: data.high24h,
            volume24h: data.volume24h,
            open24h: data.open24h,
            priceChange24h: data.priceChange24h,
            priceChangePercent24h: data.priceChangePercent24h,
        })), `TICKER-${market}`);

        SignalingManager.getInstance().sendMessage({ method: "SUBSCRIBE", params: [`ticker@${market}`] });
        setInterval(() => { getTicker(market).then(setTicker).catch(err => console.log("err", err)); }, 5000);

        return () => {
            if (timerRef.current) clearTimeout(timerRef.current);
            SignalingManager.getInstance().deRegisterCallback("ticker", `TICKER-${market}`);
            SignalingManager.getInstance().sendMessage({ method: "UNSUBSCRIBE", params: [`ticker@${market}`] });
        };
    }, [market]);

    if (!ticker) return null;

    return (
        <Card className="flex flex-col md:flex-row items-center justify-between px-4 sm:px-6 py-4 gap-4 md:gap-0 w-full max-w-[1000px] m-auto mb-2">
            {/* Left: symbol + price */}
            <div className="flex items-center gap-4 sm:gap-8">
                <div className="rounded-xl overflow-hidden ring-1 ring-border shadow-sm bg-white h-12 w-12 sm:h-14 sm:w-14 flex items-center justify-center">
                    {market === "GOOGLE_INR" ? (
                        <Image src="/google_logo.svg" height={40} width={40} alt="Google" className="h-8 w-8 object-contain" />
                    ) : market === "META_INR" ? (
                        <Image src="/meta_logo.svg" height={40} width={40} alt="Meta" className="h-8 w-8 object-contain" />
                    ) : (
                        <div className="flex h-full w-full items-center justify-center bg-muted text-sm font-semibold text-muted-foreground">
                            {market.slice(0, 1)}
                        </div>
                    )}
                </div>
                <div>
                    <h1 className="text-lg sm:text-xl font-semibold tracking-tight">{market}</h1>
                    <p className={`text-xl sm:text-2xl font-bold font-mono ${+ticker.priceChange24h >= 0 ? "text-emerald-500" : "text-red-500"}`}>
                        ₹ {ticker.lastPrice.toLocaleString()}
                    </p>
                </div>
            </div>

            {/* Right: stats + stop button */}
            <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-3 text-sm w-full md:w-auto overflow-x-auto">
                <Stat label="24h Change" value={`${(ticker.priceChangePercent24h ?? 0).toPrecision(4)}%`} Icon={ClockFading} />
                <Stat label="Volume" value={`${ticker.volume24h.toLocaleString()}`} Icon={ChartColumnStacked} />
                <Stat label="24h Low" value={"₹" + ticker.low24h.toFixed(2)} Icon={ArrowDownLeft} />
                <Stat label="24h High" value={"₹" + ticker.high24h.toFixed(2)} Icon={ArrowUpRight} />

                {tradeStopped ? (
                    <button
                        onClick={() => { SignalingManager.getInstance().startMM(market); setTradeStopped(false); scheduleStop(); }}
                        className="flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-2 text-xs font-semibold shadow hover:opacity-80 transition flex-shrink-0"
                    >
                        <Play className="h-3.5 w-3.5" />
                        Start Trade
                    </button>
                ) : (
                    <button
                        onClick={handleStopTrade}
                        className="flex items-center gap-1.5 rounded-md bg-foreground text-background px-3 py-2 text-xs font-semibold shadow hover:opacity-80 transition flex-shrink-0"
                    >
                        <Pause className="h-3.5 w-3.5" />
                        Stop Trade
                    </button>
                )}
            </div>
        </Card>
    );
}

function Stat({ label, value, Icon }: { label: string; value: string | number; Icon: LucideIcon }) {
    return (
        <div className="flex flex-col items-center gap-1 rounded-lg bg-muted px-2 sm:px-3 py-2 min-w-[72px] sm:min-w-[88px] flex-shrink-0 border border-border">
            <Icon className="h-4 w-4 text-muted-foreground" />
            <p className="text-muted-foreground text-[10px] sm:text-[11px] leading-none whitespace-nowrap">{label}</p>
            <p className="font-semibold text-xs sm:text-sm leading-none whitespace-nowrap">{value}</p>
        </div>
    );
}
