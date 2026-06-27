"use client";

import { useEffect, useRef, useState } from "react";
import { createChart, ColorType, CandlestickSeries } from "lightweight-charts";
import { useTheme } from "next-themes";
import { Card } from "@/components/ui/card";
import { TimeframeSwitch } from "./timeFrame";
import axios from "axios";

export function PriceChart({ market = "TATA_INR" }: { market?: string }) {
    const ref = useRef<HTMLDivElement>(null);
    const [tf, setTf] = useState<"1h" | "1m" | "3s">("3s");
    const { resolvedTheme } = useTheme();

    useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = "";

        const dark = resolvedTheme === "dark";

        const chart = createChart(ref.current, {
            height: 400,
            autoSize: true,
            timeScale: { barSpacing: tf === "3s" ? 12 : 5 },
            layout: {
                background: { type: ColorType.Solid, color: dark ? "#0f0f0f" : "#ffffff" },
                textColor: dark ? "#a1a1aa" : "#52525b",
            },
            grid: {
                vertLines: { color: dark ? "#27272a" : "#f4f4f5" },
                horzLines: { color: dark ? "#27272a" : "#f4f4f5" },
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
            timeScale: { timeVisible: true, secondsVisible: tf === "3s" },
        });

        const interval = setInterval(() => {
            const endTime = Date.now();
            const startTime = 1767020774440;
            axios
                .get(`http://localhost:8000/api/v1/klines?market=${market}&interval=${tf}&endTime=${endTime}&startTime=${startTime}`)
                .then((res) => {
                    const recent = tf === "3s" ? res.data.slice(-30) : res.data.slice(-60);
                    series.setData(recent);
                    if (tf === "3s") chart.timeScale().scrollToRealTime();
                    else chart.timeScale().fitContent();
                });
        }, 2000);

        return () => { clearInterval(interval); chart.remove(); };
    }, [tf, market, resolvedTheme]);

    return (
        <Card className="p-4 h-full">
            <div className="flex items-center justify-between mb-3">
                <h2 className="text-sm font-semibold text-muted-foreground">Price Chart</h2>
                <TimeframeSwitch value={tf} onChange={setTf} />
            </div>
            <div className="rounded-lg overflow-hidden border border-border">
                <div ref={ref} />
            </div>
        </Card>
    );
}
