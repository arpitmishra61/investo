"use client";

import { Button } from "@/components/ui/button";

export function TimeframeSwitch({
    value,
    onChange,
}: {
    value: "1h" | "1m";
    onChange: (v: "1h" | "1m") => void;
}) {
    return (
        <div className="flex gap-2 mb-2">
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
        </div>
    );
}
