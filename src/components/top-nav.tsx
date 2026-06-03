"use client";

import type { ReactNode } from "react";
import { usePrivy, useActiveWallet } from "@privy-io/react-auth";
import { Button } from "@/components/ui/button";

function truncateAddress(address?: string) {
  if (!address) return "";
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

/** Shared header chrome so the live nav and the skeleton stay visually aligned. */
function NavShell({ children }: { children: ReactNode }) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4">
        <div className="flex items-center gap-6">
          <a href="/" className="font-semibold tracking-tight">
            ModelFuel
          </a>
          <nav className="flex items-center gap-4 text-sm text-muted-foreground">
            <a href="/market" className="hover:text-foreground">
              Market
            </a>
            <a href="/sell" className="hover:text-foreground">
              List a dataset
            </a>
            <a href="/my-listings" className="hover:text-foreground">
              My listings
            </a>
            <a href="/my/library" className="hover:text-foreground">
              Library
            </a>
          </nav>
        </div>
        <div className="flex items-center gap-2">{children}</div>
      </div>
    </header>
  );
}

/**
 * Static nav rendered when Privy isn't configured (no app id yet). Calls no
 * Privy hooks, so it's safe to render without a PrivyProvider in the tree.
 */
export function TopNavSkeleton() {
  return (
    <NavShell>
      <Button size="sm" disabled title="Set NEXT_PUBLIC_PRIVY_APP_ID to enable sign-in">
        Sign in
      </Button>
    </NavShell>
  );
}

export function TopNav() {
  const { ready, authenticated, login, logout } = usePrivy();
  const { wallet } = useActiveWallet();

  return (
    <NavShell>
      {!ready ? (
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" aria-hidden />
      ) : authenticated ? (
        <>
          {/* Wallet-address pill */}
          <span
            className="inline-flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1 font-mono text-sm"
            title={wallet?.address ?? "No active wallet"}
          >
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {truncateAddress(wallet?.address) || "No wallet"}
          </span>
          <Button variant="ghost" size="sm" onClick={() => logout()}>
            Sign out
          </Button>
        </>
      ) : (
        <Button size="sm" onClick={() => login()}>
          Sign in
        </Button>
      )}
    </NavShell>
  );
}
