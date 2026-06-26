"use client";

// Timer and start/stop trade logic lives in TopBar — this wrapper is kept
// only as a client boundary so page.tsx (server component) can pass market down.
export function TradeSessionGuard({
  children,
}: {
  market: string;
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
