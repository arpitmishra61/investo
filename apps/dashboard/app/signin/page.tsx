"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TrendingUpIcon, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "../components/ThemeToggle";
import { API_URL } from "@/lib/config";

const GUESTS = [
  { name: "Alice", email: "alice@guest.investo", password: "alice123", initials: "AL" },
  { name: "Bob", email: "bob@guest.investo", password: "bob123", initials: "BO" },
];

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [guestModal, setGuestModal] = useState(false);
  const [guestLoading, setGuestLoading] = useState<string | null>(null);

  async function signIn(emailVal: string, passwordVal: string) {
    const res = await fetch(`${API_URL}/api/v1/auth/signin`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: emailVal, password: passwordVal }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Sign in failed");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify(data.user));
    router.push("/markets");
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Could not reach the server");
    } finally {
      setLoading(false);
    }
  }

  async function handleGuestLogin(guest: (typeof GUESTS)[number]) {
    setGuestLoading(guest.name);
    try {
      await signIn(guest.email, guest.password);
    } catch {
      setGuestModal(false);
      setError("Guest login failed — run seed:users first");
    } finally {
      setGuestLoading(null);
    }
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <nav className="flex items-center justify-between px-8 py-5 border-b border-border">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500 text-black">
            <TrendingUpIcon size={16} strokeWidth={2.5} />
          </div>
          <span className="text-lg font-bold tracking-tight">
            Trade<span className="text-emerald-500">Pi</span>
          </span>
        </Link>
        <ThemeToggle />
      </nav>

      <div className="flex flex-1 items-center justify-center px-4">
        <div className="w-full max-w-sm">
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold tracking-tight">Welcome back</h1>
            <p className="mt-1 text-sm text-muted-foreground">Sign in to your TradePi account</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                autoComplete="email"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
            </div>

            {error && <p className="text-sm text-red-500">{error}</p>}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-emerald-500 text-black hover:bg-emerald-400 font-semibold"
            >
              {loading ? "Signing in…" : "Sign in"}
            </Button>
          </form>

          {/* Divider */}
          <div className="my-5 flex items-center gap-3">
            <div className="h-px flex-1 bg-border" />
            <span className="text-xs text-muted-foreground">or</span>
            <div className="h-px flex-1 bg-border" />
          </div>

          {/* Guest login */}
          <button
            onClick={() => setGuestModal(true)}
            className="w-full py-2.5 rounded-md border border-border bg-muted text-sm font-medium text-foreground hover:bg-accent transition-colors"
          >
            Login as Guest
          </button>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <Link href="/signup" className="text-foreground font-medium underline underline-offset-4 hover:text-emerald-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>

      {/* Guest modal */}
      {guestModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          onClick={() => setGuestModal(false)}
        >
          <div
            className="relative w-full max-w-xs rounded-2xl border border-border bg-background p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setGuestModal(false)}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={16} />
            </button>

            <h2 className="text-base font-semibold mb-1">Continue as guest</h2>
            <p className="text-xs text-muted-foreground mb-5">Choose a guest profile to explore TradePi</p>

            <div className="space-y-3">
              {GUESTS.map((guest) => (
                <button
                  key={guest.name}
                  disabled={!!guestLoading}
                  onClick={() => handleGuestLogin(guest)}
                  className="flex w-full items-center gap-4 rounded-xl border border-border bg-muted px-4 py-3 text-left hover:bg-accent transition-colors disabled:opacity-50"
                >
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500 text-sm font-bold">
                    {guest.initials}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium">{guest.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{guest.email}</p>
                  </div>
                  {guestLoading === guest.name && (
                    <div className="ml-auto h-4 w-4 rounded-full border-2 border-emerald-500 border-t-transparent animate-spin" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
