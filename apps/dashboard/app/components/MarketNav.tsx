"use client";
import Link from "next/link";
import { TrendingUpIcon, ChartCandlestick } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { UserMenu } from "./UserMenu";

export function MarketNav() {
    return (
        <div className="flex justify-between items-center gap-2 flex-wrap">
            <Link href="/markets" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black">
                    <TrendingUpIcon size={16} strokeWidth={2.5} />
                </div>
                <span className="text-lg font-bold tracking-tight">
                    Trade<span className="text-emerald-500">Pi</span>
                </span>
            </Link>
            <div className="flex gap-2 sm:gap-3 items-center">
                <Link
                    href="/orders"
                    className="inline-flex items-center gap-2 rounded-full border border-border bg-muted px-3 sm:px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition"
                >
                    <ChartCandlestick className="h-4 w-4" />
                    <span className="hidden sm:inline">Orders</span>
                </Link>
                <UserMenu />
                <ThemeToggle />
            </div>
        </div>
    );
}
