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

export function PriceChart() {
    const ref = useRef<HTMLDivElement>(null);
    const [tf, setTf] = useState<"1h" | "1m">("1m");

    useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = "";

        const chart = createChart(ref.current, {
            height: 400,
            width: ref.current.clientWidth,
            autoSize: true,
            timeScale: {
                barSpacing: 5,
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

                secondsVisible: false,
            },
        });
        const interval = setInterval(() => {
            const currentTime = Date.now()
            //const day = 10 * 24 * 60 * 60 * 10
            const startTime = 1767020774440
            const endTime = currentTime
            axios.get(`http://localhost:8000/api/v1/klines?symbol=TATA_INR&interval=${tf}&endTime=${endTime}&startTime=${startTime}`).then(res => {
                const recent = res.data.slice(-10);

                series.setData(recent);

                chart.timeScale().fitContent();
            })

        }, 2000)


        return () => {
            clearInterval(interval)
            chart.remove()

        }
    }, [tf]);

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
