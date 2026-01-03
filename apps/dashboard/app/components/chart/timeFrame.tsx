"use client";

import { Button } from "@/components/ui/button";

export function TimeframeSwitch({
    value,
    onChange,
}: {
    value: "1s" | "1m";
    onChange: (v: "1s" | "1m") => void;
}) {
    return (
        <div className="flex gap-2 mb-2">
            <Button
                size="sm"
                variant={value === "1s" ? "default" : "outline"}
                onClick={() => onChange("1s")}
            >
                1s
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
