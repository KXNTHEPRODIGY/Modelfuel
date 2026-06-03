"use client";

import { usePrivy } from "@privy-io/react-auth";
import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import { Button } from "@/components/ui/button";

/**
 * Auth-aware surface for the home page. Demonstrates the full Privy wiring:
 * login state from `usePrivy`, and a Story-Aeneid viem signer derived from the
 * active wallet via `useStoryWalletClient` (the same client CDR + IP txs use).
 */
export function AuthPanel() {
  const { ready, authenticated, login } = usePrivy();
  const { address, ready: walletReady } = useStoryWalletClient();

  if (!ready) {
    return (
      <div
        className="h-28 w-full max-w-md animate-pulse rounded-lg border bg-muted/30"
        aria-hidden
      />
    );
  }

  if (!authenticated) {
    return (
      <div className="flex w-full max-w-md flex-col items-start gap-3 rounded-lg border p-6">
        <p className="text-sm text-muted-foreground">
          Sign in to list or license models &amp; datasets. New here? A wallet is
          created for you automatically.
        </p>
        <Button onClick={() => login()}>Sign in to get started</Button>
      </div>
    );
  }

  return (
    <div className="flex w-full max-w-md flex-col gap-3 rounded-lg border p-6">
      <p className="text-sm font-medium">You&apos;re signed in.</p>
      <div className="flex items-center gap-2">
        <span
          className={`h-2 w-2 rounded-full ${
            walletReady ? "bg-emerald-500" : "bg-amber-500"
          }`}
        />
        <span className="font-mono text-sm">
          {address ?? "Provisioning wallet…"}
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        {walletReady
          ? "Wallet ready to sign on Story Aeneid (CDR vaults + IP / license txs)."
          : "Preparing your Story Aeneid signer…"}
      </p>
      <a href="/sell" className="mt-1">
        <Button disabled={!walletReady}>List a dataset →</Button>
      </a>
    </div>
  );
}
