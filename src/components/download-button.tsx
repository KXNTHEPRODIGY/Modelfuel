"use client";

import { useState } from "react";
import { encodeAbiParameters } from "viem";
import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import { createCdrClient, ensureCdrWasm } from "@/lib/onchain/cdr";
import { createSignedUrlStorageProvider } from "@/lib/storage-provider";
import type { Listing, Purchase } from "@/lib/supabase/types";
import { Button } from "@/components/ui/button";

type Phase = "idle" | "preparing" | "reading" | "decrypting" | "done" | "error";

const LABEL: Record<Phase, string> = {
  idle: "Download",
  preparing: "Preparing crypto…",
  reading: "Sign read + collecting validator shares…",
  decrypting: "Combining key + decrypting locally…",
  done: "Downloaded ✓",
  error: "Retry download",
};

/**
 * Fully client-side decrypt: the buyer's own wallet signs the license-gated CDR
 * read, the SDK collects validator shares + combines the key (WASM) and
 * AES-decrypts the ciphertext — all in the browser. The server only hands out a
 * signed URL to the ciphertext. Works for EOA and embedded wallets alike.
 */
export function DownloadButton({
  purchase,
  listing,
}: {
  purchase: Purchase;
  listing: Listing | null;
}) {
  const { getWalletClient } = useStoryWalletClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);

  async function run() {
    setError(null);
    try {
      if (!purchase.license_token_id) {
        throw new Error("This purchase has no license token id.");
      }
      if (!listing?.main_vault_id) {
        throw new Error("This listing is missing its vault id.");
      }

      setPhase("preparing");
      const wallet = await getWalletClient();
      if (!wallet) throw new Error("Connect your wallet to download.");
      await ensureCdrWasm();
      const cdr = createCdrClient(wallet);

      const accessAuxData = encodeAbiParameters(
        [{ type: "uint256[]" }],
        [[BigInt(purchase.license_token_id)]],
      );

      setPhase("reading");
      const { content } = await cdr.consumer.downloadFile({
        uuid: Number(listing.main_vault_id),
        accessAuxData,
        storageProvider: createSignedUrlStorageProvider(),
        timeoutMs: 180_000,
        // The stored "cid" is a Supabase path, not a content hash.
        skipCidVerification: true,
      });

      setPhase("decrypting");
      const buf = new ArrayBuffer(content.byteLength);
      new Uint8Array(buf).set(content);
      const url = URL.createObjectURL(new Blob([buf]));
      const a = document.createElement("a");
      a.href = url;
      a.download = `${listing.title ?? "dataset"}.bin`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      setPhase("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Download failed");
      setPhase("error");
    }
  }

  const busy = phase === "preparing" || phase === "reading" || phase === "decrypting";

  return (
    <div className="text-right">
      <Button variant="outline" size="sm" onClick={run} disabled={busy}>
        {LABEL[phase]}
      </Button>
      {busy && <p className="mt-1 max-w-xs text-xs text-muted-foreground">{LABEL[phase]}</p>}
      {error && <p className="mt-1 max-w-xs text-xs text-red-500">{error}</p>}
    </div>
  );
}
