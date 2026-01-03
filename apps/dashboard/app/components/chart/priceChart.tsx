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
    const [tf, setTf] = useState<"1s" | "1m">("1m");

    useEffect(() => {
        if (!ref.current) return;
        ref.current.innerHTML = "";

        const chart = createChart(ref.current, {
            height: 400,
            width: 700,
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
        axios.get("http://localhost:8000/api/v1/klines?symbol=TATA_INR&interval=1m&endTime=1767203390233&startTime=1767020774440").then(res => {
            series.setData(res.data);
            chart.timeScale().fitContent();
        })

        return () => chart.remove();
    }, [tf]);

    return (
        <Card className="p-4">
            <TimeframeSwitch value={tf} onChange={setTf} />
            <div ref={ref} />
        </Card>
    );
}
