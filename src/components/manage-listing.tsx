"use client";

import { useState } from "react";
import type { Listing } from "@/lib/supabase/types";
import { formatCountdown } from "@/lib/listings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export function ManageListing({
  listing,
  onUpdated,
}: {
  listing: Listing;
  onUpdated: (updated: Listing) => void;
}) {
  const [busy, setBusy] = useState<"delist" | "extend" | null>(null);
  const [days, setDays] = useState(30);
  const [error, setError] = useState<string | null>(null);

  async function patch(body: Record<string, unknown>, kind: "delist" | "extend") {
    setBusy(kind);
    setError(null);
    try {
      const res = await fetch(`/api/listings/${listing.id}`, {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? `${res.status}`);
      onUpdated(json.listing as Listing);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Update failed");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="space-y-4 rounded-lg border border-dashed p-5">
      <div>
        <h2 className="text-sm font-semibold">Manage listing</h2>
        <p className="text-xs text-muted-foreground">
          You own this listing. Status: <span className="font-medium">{listing.status}</span> ·{" "}
          {formatCountdown(listing.expires_at)}
        </p>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <div className="flex items-end gap-2">
          <div className="space-y-1">
            <label htmlFor="extend-days" className="text-xs text-muted-foreground">
              Extend by (days)
            </label>
            <Input
              id="extend-days"
              type="number"
              min={1}
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-28"
            />
          </div>
          <Button
            variant="outline"
            disabled={busy !== null || days < 1}
            onClick={() => patch({ action: "extend", days }, "extend")}
          >
            {busy === "extend" ? "Extending…" : "Extend expiry"}
          </Button>
        </div>

        <Button
          variant="destructive"
          disabled={busy !== null || listing.status === "delisted"}
          onClick={() => patch({ action: "delist" }, "delist")}
        >
          {busy === "delist" ? "Delisting…" : "Delist"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
