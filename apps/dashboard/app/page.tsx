import Link from "next/link";
import { TrendingUpIcon, ArrowRight, BarChart2, Zap, Shield } from "lucide-react";
import { ThemeToggle } from "./components/ThemeToggle";
import { UserMenu } from "./components/UserMenu";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5 border-b border-border bg-background/80 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black">
            <TrendingUpIcon size={16} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trade<span className="text-emerald-500">Pi</span>
          </span>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-2 sm:gap-3">
          <UserMenu />
          <ThemeToggle />
        </div>
      </nav>

      {/* Hero */}
      <section className="relative flex flex-col items-center justify-center px-6 pt-40 pb-20 text-center">
        {/* Background glow — visible in dark, subtle in light */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute left-1/2 top-1/3 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-500/10 blur-[120px] dark:bg-emerald-500/12" />
          <div className="absolute left-1/4 top-2/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-blue-500/6 blur-[100px]" />
          <div className="absolute right-1/4 top-1/4 h-[250px] w-[250px] rounded-full bg-violet-500/6 blur-[100px]" />
        </div>

        {/* Badge */}
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground backdrop-blur-sm">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
          Simulated markets · Real mechanics
        </div>

        {/* Headline */}
        <h1 className="max-w-3xl text-5xl sm:text-6xl md:text-7xl font-bold leading-[1.08] tracking-tight">
          Modern{" "}
          <span className="bg-gradient-to-r from-emerald-500 to-emerald-400 bg-clip-text text-transparent">
            stock trading.
          </span>
        </h1>

        {/* Subheading */}
        <p className="mt-6 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          Practice real order-book mechanics with live matching, depth charts,
          and candlestick data — all in a risk-free simulated environment.
        </p>

        {/* CTA */}
        <div className="mt-10 flex flex-col sm:flex-row items-center gap-4">
          <Link
            href="/markets"
            className="group flex items-center gap-2.5 rounded-full bg-emerald-500 text-black px-8 py-3.5 text-sm font-bold hover:bg-emerald-400 transition-all shadow-[0_0_40px_rgba(52,211,153,0.2)] hover:shadow-[0_0_60px_rgba(52,211,153,0.35)]"
          >
            Explore Markets
            <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {/* Stats row */}
        <div className="mt-20 flex flex-wrap items-center justify-center gap-8 sm:gap-16">
          {[
            { label: "Markets", value: "2" },
            { label: "Order Types", value: "Limit · Market" },
            { label: "Latency", value: "< 5ms" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <div className="text-2xl font-bold">{s.value}</div>
              <div className="mt-0.5 text-xs text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feature strip */}
      <section className="border-t border-border px-6 py-24">
        <div className="mx-auto max-w-5xl grid grid-cols-1 sm:grid-cols-3 gap-8">
          {[
            {
              icon: <Zap size={20} />,
              title: "Real-time matching",
              desc: "In-memory order book engine with sub-millisecond matching and live WebSocket depth updates.",
            },
            {
              icon: <BarChart2 size={20} />,
              title: "Candlestick charts",
              desc: "OHLC klines served from TimescaleDB materialized views — 3s, 1m, 1h, and 1w intervals.",
            },
            {
              icon: <Shield size={20} />,
              title: "Risk-free simulation",
              desc: "Every account starts with ₹10M and 10M shares. Trade freely without real consequences.",
            },
          ].map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-border bg-card p-6 hover:border-foreground/15 hover:bg-accent/50 transition-all"
            >
              <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-500">
                {f.icon}
              </div>
              <h3 className="text-sm font-semibold mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-8 py-6 flex items-center justify-between text-xs text-muted-foreground">
        <div className="flex items-center gap-2">
          <div className="flex h-5 w-5 items-center justify-center rounded bg-emerald-500 text-black">
            <TrendingUpIcon size={11} strokeWidth={2.5} />
          </div>
          TradePi
        </div>
        <span>Simulated trading · Not financial advice</span>
      </footer>
    </div>
  );
}
