"use client";

import { useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import { createStoryClient } from "@/lib/onchain/story";
import { txExplorerUrl } from "@/lib/onchain/addresses";
import type { Listing } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "verifying" | "minting" | "recording" | "done" | "error";

export function BuyButton({ listing }: { listing: Listing }) {
  const { authenticated, login } = usePrivy();
  const { address, getWalletClient } = useStoryWalletClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<{ licenseTokenId?: string; txHash?: string } | null>(
    null,
  );

  async function buy() {
    setError(null);
    if (!authenticated) {
      login();
      return;
    }
    try {
      // 1. Authoritative re-check that the listing is still purchasable.
      setPhase("verifying");
      const vRes = await fetch("/api/buy/verify", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ listingId: listing.id }),
      });
      const v = await vRes.json();
      if (!vRes.ok) throw new Error(v?.error ?? "Listing is not purchasable");

      const wallet = await getWalletClient();
      if (!wallet || !address) throw new Error("Wallet not ready — reconnect and retry.");

      // 2. Pay the seller + receive the license token (fee auto-wrapped to WIP).
      setPhase("minting");
      const story = createStoryClient(wallet);
      const mint = await story.license.mintLicenseTokens({
        licensorIpId: v.ipId as `0x${string}`,
        licenseTermsId: BigInt(v.licenseTermsId),
        receiver: address,
        amount: 1,
      });
      const licenseTokenId = mint.licenseTokenIds?.[0]?.toString();

      // 3. Record the purchase.
      setPhase("recording");
      await fetch("/api/purchases", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          listing_id: listing.id,
          buyer_address: address,
          license_token_id: licenseTokenId ?? null,
          tx_hash: mint.txHash ?? null,
        }),
      });

      setResult({ licenseTokenId, txHash: mint.txHash });
      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Purchase failed");
      setPhase("error");
    }
  }

  if (phase === "done") {
    return (
      <div className="space-y-1">
        <p className="text-sm font-medium text-emerald-600">
          License purchased ✓ {result?.licenseTokenId && `(token #${result.licenseTokenId})`}
        </p>
        {result?.txHash && (
          <a
            href={txExplorerUrl(result.txHash)}
            target="_blank"
            rel="noopener noreferrer"
            className="block text-xs text-blue-600 hover:underline"
          >
            view transaction
          </a>
        )}
        <p className="text-xs text-muted-foreground">
          Unlock it in{" "}
          <a href="/my/library" className="underline">
            your library
          </a>
          .
        </p>
      </div>
    );
  }

  const busy = phase === "verifying" || phase === "minting" || phase === "recording";
  const label =
    phase === "verifying"
      ? "Verifying…"
      : phase === "minting"
        ? "Minting license…"
        : phase === "recording"
          ? "Recording…"
          : `Buy for ${listing.price_ip ?? 0} $IP`;

  return (
    <div className="space-y-2">
      <Button size="lg" onClick={buy} disabled={busy}>
        {label}
      </Button>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
