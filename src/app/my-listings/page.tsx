"use client";

import { useEffect, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import { fetchListingsBySeller, isExpired } from "@/lib/listings";
import type { Listing } from "@/lib/supabase/types";
import { ListingCard } from "@/components/listing-card";
import { Button } from "@/components/ui/button";

function statusBadge(listing: Listing) {
  let label = listing.status;
  if (listing.status === "active" && isExpired(listing.expires_at)) label = "expired";
  const tone =
    label === "active"
      ? "border-emerald-500/40 text-emerald-600"
      : "border-muted-foreground/30 text-muted-foreground";
  return (
    <span className={`rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide ${tone}`}>
      {label}
    </span>
  );
}

export default function MyListingsPage() {
  const { ready, authenticated, login } = usePrivy();
  const { address } = useStoryWalletClient();

  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!address) return;
    let cancelled = false;
    setLoading(true);
    fetchListingsBySeller(address)
      .then((d) => !cancelled && (setListings(d), setLoading(false)))
      .catch((e) => !cancelled && (setError(e.message), setLoading(false)));
    return () => {
      cancelled = true;
    };
  }, [address]);

  if (ready && !authenticated) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">My listings</h1>
        <p className="mt-3 text-muted-foreground">Sign in to view the listings you&apos;ve published.</p>
        <Button className="mt-6" onClick={() => login()}>
          Sign in
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">My listings</h1>
      <p className="mt-2 break-all font-mono text-xs text-muted-foreground">{address}</p>

      <div className="mt-8">
        {loading || !address ? (
          <p className="text-sm text-muted-foreground">Loading your listings…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : listings.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            You haven&apos;t published any listings yet.{" "}
            <a href="/sell" className="underline">
              List a dataset
            </a>
            .
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {listings.map((l) => (
              <ListingCard key={l.id} listing={l} badge={statusBadge(l)} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
