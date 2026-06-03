"use client";

import { useEffect, useState } from "react";
import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import {
  fetchListingById,
  formatCountdown,
  isExpired,
} from "@/lib/listings";
import type { Listing } from "@/lib/supabase/types";
import {
  TRAINING_STAGE_LABELS,
  addressExplorerUrl,
  type TrainingStage,
} from "@/lib/onchain/addresses";
import { SamplePreview } from "@/components/sample-preview";
import { ManageListing } from "@/components/manage-listing";
import { BuyButton } from "@/components/buy-button";

export default function ListingDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const { address } = useStoryWalletClient();
  const [listing, setListing] = useState<Listing | null>(null);
  const [state, setState] = useState<"loading" | "notfound" | "error" | "ready">(
    "loading",
  );
  const [error, setError] = useState<string | null>(null);
  const [, setTick] = useState(0); // drives the live countdown

  useEffect(() => {
    let cancelled = false;
    fetchListingById(params.id)
      .then((l) => {
        if (cancelled) return;
        if (!l) setState("notfound");
        else {
          setListing(l);
          setState("ready");
        }
      })
      .catch((e) => {
        if (cancelled) return;
        setError(e.message);
        setState("error");
      });
    return () => {
      cancelled = true;
    };
  }, [params.id]);

  useEffect(() => {
    const t = setInterval(() => setTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (state === "loading") {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-muted-foreground">Loading…</main>;
  }
  if (state === "notfound") {
    return (
      <main className="mx-auto max-w-3xl px-4 py-16">
        <p className="text-muted-foreground">Listing not found.</p>
        <a href="/market" className="mt-4 inline-block underline">
          Back to market
        </a>
      </main>
    );
  }
  if (state === "error" || !listing) {
    return <main className="mx-auto max-w-3xl px-4 py-16 text-red-500">{error}</main>;
  }

  const expired = isExpired(listing.expires_at);
  const stageLabel = listing.training_stage
    ? TRAINING_STAGE_LABELS[listing.training_stage as TrainingStage]
    : "—";
  const isOwner =
    !!address && address.toLowerCase() === listing.seller_address.toLowerCase();

  return (
    <main className="mx-auto max-w-3xl px-4 py-10">
      <a href="/market" className="text-sm text-muted-foreground hover:underline">
        ← Market
      </a>

      <div className="mt-4 flex items-start justify-between gap-4">
        <h1 className="text-3xl font-semibold tracking-tight">{listing.title}</h1>
        <span className="shrink-0 rounded bg-muted px-2 py-1 text-xs text-muted-foreground">
          {stageLabel}
        </span>
      </div>

      {listing.description && (
        <p className="mt-4 whitespace-pre-wrap text-muted-foreground">{listing.description}</p>
      )}

      <dl className="mt-6 grid grid-cols-2 gap-4 text-sm sm:grid-cols-4">
        <div>
          <dt className="text-muted-foreground">Price</dt>
          <dd className="font-semibold">{listing.price_ip ?? 0} $IP</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Training stage</dt>
          <dd>{stageLabel}</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Expires</dt>
          <dd className={expired ? "text-red-500" : undefined}>
            {formatCountdown(listing.expires_at)}
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Seller</dt>
          <dd>
            <a
              href={addressExplorerUrl(listing.seller_address)}
              target="_blank"
              rel="noopener noreferrer"
              className="font-mono text-blue-600 hover:underline"
            >
              {listing.seller_address.slice(0, 6)}…{listing.seller_address.slice(-4)}
            </a>
          </dd>
        </div>
      </dl>

      {listing.sample_cid && (
        <section className="mt-8">
          <h2 className="mb-2 text-sm font-semibold">Sample preview</h2>
          <SamplePreview cid={listing.sample_cid} />
        </section>
      )}

      <section className="mt-8">
        {listing.status === "active" && !expired ? (
          <BuyButton listing={listing} />
        ) : (
          <p className="text-sm text-muted-foreground">
            This listing is {expired ? "expired" : listing.status} and can&apos;t be purchased.
          </p>
        )}
      </section>

      {isOwner && (
        <section className="mt-10">
          <ManageListing listing={listing} onUpdated={setListing} />
        </section>
      )}
    </main>
  );
}
