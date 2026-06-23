"use client";

import { Button } from "@/components/ui/button";

export function TimeframeSwitch({
    value,
    onChange,
}: {
    value: "1h" | "1m" | "3s";
    onChange: (v: "1h" | "1m" | "3s") => void;
}) {
    return (
        <div className="flex gap-2">
            <Button
                size="sm"
                variant={value === "1h" ? "default" : "outline"}
                onClick={() => onChange("1h")}
            >
                1h
            </Button>
            <Button
                size="sm"
                variant={value === "1m" ? "default" : "outline"}
                onClick={() => onChange("1m")}
            >
                1m
            </Button>
            <Button
                size="sm"
                variant={value === "3s" ? "default" : "outline"}
                onClick={() => onChange("3s")}
            >
                3s
            </Button>
        </div>
    );
}
