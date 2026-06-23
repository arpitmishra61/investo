"use client";

import { useEffect, useRef, useState } from "react";
import {
    createChart,
    ColorType,
    CandlestickSeries,
} from "lightweight-charts";

import { Card } from "@/components/ui/card";
import { TimeframeSwitch } from "./timeFrame";
import axios from "axios";

export function PriceChart({ market = "TATA_INR" }: { market?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [tf, setTf] = useState<"1h" | "1m" | "3s">("1m");

    useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = "";

        const chart = createChart(ref.current, {
            height: 400,
            width: ref.current.clientWidth,
            autoSize: true,
            timeScale: {
                barSpacing: tf === "3s" ? 12 : 5,
            },
            layout: {
                background: { type: ColorType.Solid, color: "#ffffff" },
                textColor: "#111",
            },
            grid: {
                vertLines: { color: "#eee" },
                horzLines: { color: "#eee" },
            },


        });

        const series = chart.addSeries(CandlestickSeries, {
            upColor: "#22c55e",
            downColor: "#ef4444",
            borderVisible: false,
            wickUpColor: "#22c55e",
            wickDownColor: "#ef4444",
        });
        chart.applyOptions({
            timeScale: {
                timeVisible: true,

                secondsVisible: tf === "3s",
            },
        });
        const pollMs = 2000;
        const interval = setInterval(() => {
            const currentTime = Date.now()
            // 3s candles query the raw trades table directly (see kline.ts), so
            // keep the window short instead of pulling the whole history.
            const startTime = 1767020774440
            const endTime = currentTime
            axios.get(`http://localhost:8000/api/v1/klines?market=${market}&interval=${tf}&endTime=${endTime}&startTime=${startTime}`).then(res => {
                const recent = tf === "3s" ? res.data.slice(-30) : res.data.slice(-60);

                series.setData(recent);

                if (tf === "3s") {
                    chart.timeScale().scrollToRealTime();
                } else {
                    chart.timeScale().fitContent();
                }
            })

        }, pollMs)


        return () => {
            clearInterval(interval)
            chart.remove()

        }
    }, [tf, market]);

    return (
        <Card className="p-4 border-zinc-200 shadow-md h-full">
            <div className="flex items-center justify-between mb-2">
                <h2 className="text-sm font-semibold text-zinc-700">Price Chart</h2>
                <TimeframeSwitch value={tf} onChange={setTf} />
            </div>
            <div className="rounded-lg overflow-hidden border border-zinc-100">
                <div ref={ref} />
            </div>
        </Card>
    );
}
