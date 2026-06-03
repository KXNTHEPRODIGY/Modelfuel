"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import type { Listing, Purchase } from "@/lib/supabase/types";
import { txExplorerUrl } from "@/lib/onchain/addresses";
import { Button } from "@/components/ui/button";
import { DownloadButton } from "@/components/download-button";

type Row = { purchase: Purchase; listing: Listing | null };

export default function LibraryPage() {
  const { ready, authenticated, login } = usePrivy();
  const { address } = useStoryWalletClient();

  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    fetch(`/api/purchases?buyer=${address}`)
      .then((r) => r.json())
      .then((j) => {
        if (cancelled) return;
        if (j.error) setError(typeof j.error === "string" ? j.error : "Failed to load");
        else setRows(j.rows ?? []);
        setLoading(false);
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (ready && !authenticated) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">Your library</h1>
        <p className="mt-3 text-muted-foreground">Sign in to see what you&apos;ve purchased.</p>
        <Button className="mt-6" onClick={() => login()}>
          Sign in
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Your library</h1>
      <p className="mt-2 text-muted-foreground">Datasets you hold a license to.</p>

      <div className="mt-8 space-y-3">
        {loading || !address ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No purchases yet. <a href="/market" className="underline">Browse the market</a>.
          </p>
        ) : (
          rows.map(({ purchase, listing }) => (
            <div
              key={purchase.id}
              className="flex items-center justify-between gap-4 rounded-lg border p-4"
            >
              <div className="min-w-0">
                <a
                  href={listing ? `/listing/${listing.id}` : "#"}
                  className="font-medium hover:underline"
                >
                  {listing?.title ?? "(listing removed)"}
                </a>
                <p className="mt-0.5 truncate font-mono text-xs text-muted-foreground">
                  license #{purchase.license_token_id ?? "—"} · vault{" "}
                  {listing?.main_vault_id ?? "—"}
                  {purchase.tx_hash && (
                    <>
                      {" · "}
                      <a
                        href={txExplorerUrl(purchase.tx_hash)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        tx
                      </a>
                    </>
                  )}
                </p>
              </div>
              <div className="flex shrink-0 flex-col items-end gap-2">
                {purchase.tx_hash && (
                  <a
                    href={`/receipt/${purchase.tx_hash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-xs font-medium text-muted-foreground hover:text-foreground"
                  >
                    View receipt ↗
                  </a>
                )}
                <DownloadButton purchase={purchase} listing={listing} />
              </div>
            </div>
          ))
        )}
      </div>

      <p className="mt-8 rounded-lg border border-dashed p-4 text-xs text-muted-foreground">
        Downloads decrypt entirely in your browser: your wallet signs the license-gated CDR
        read, your browser collects the validator shares, recovers the AES key, and decrypts the
        file. The server only hands out a signed link to the ciphertext — it never sees the key or
        the plaintext. Works with any wallet (EOA or embedded).
      </p>
    </main>
  );
}
