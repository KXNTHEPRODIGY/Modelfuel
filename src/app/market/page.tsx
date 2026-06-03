"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { fetchActiveListings } from "@/lib/listings";
import type { Listing } from "@/lib/supabase/types";
import {
  TRAINING_STAGES,
  TRAINING_STAGE_LABELS,
  type TrainingStage,
} from "@/lib/onchain/addresses";
import { ListingCard } from "@/components/listing-card";
import { Input } from "@/components/ui/input";

type PriceBucket = "any" | "lt10" | "10to50" | "50to100" | "gt100";
const PRICE_BUCKETS: { key: PriceBucket; label: string; test: (p: number) => boolean }[] =
  [
    { key: "any", label: "Any price", test: () => true },
    { key: "lt10", label: "< 10", test: (p) => p < 10 },
    { key: "10to50", label: "10–50", test: (p) => p >= 10 && p <= 50 },
    { key: "50to100", label: "50–100", test: (p) => p > 50 && p <= 100 },
    { key: "gt100", label: "100+", test: (p) => p > 100 },
  ];

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3 py-1 text-sm transition-colors ${
        active
          ? "border-[#FF6B1A] bg-[#FF6B1A] text-[#0A0A0A]"
          : "text-muted-foreground hover:bg-muted/50"
      }`}
    >
      {children}
    </button>
  );
}

export default function MarketPage() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [search, setSearch] = useState("");
  const [stages, setStages] = useState<Set<TrainingStage>>(new Set());
  const [bucket, setBucket] = useState<PriceBucket>("any");
  const [sampleOnly, setSampleOnly] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetchActiveListings()
      .then((d) => !cancelled && (setListings(d), setLoading(false)))
      .catch((e) => !cancelled && (setError(e.message), setLoading(false)));
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const bucketDef = PRICE_BUCKETS.find((b) => b.key === bucket)!;
    return listings.filter((l) => {
      if (q && !l.title.toLowerCase().includes(q)) return false;
      if (
        stages.size > 0 &&
        (!l.training_stage || !stages.has(l.training_stage as TrainingStage))
      )
        return false;
      if (!bucketDef.test(l.price_ip ?? 0)) return false;
      if (sampleOnly && !l.sample_cid) return false;
      return true;
    });
  }, [listings, search, stages, bucket, sampleOnly]);

  function toggleStage(s: TrainingStage) {
    setStages((prev) => {
      const next = new Set(prev);
      if (next.has(s)) next.delete(s);
      else next.add(s);
      return next;
    });
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <h1 className="text-3xl font-semibold tracking-tight">Marketplace</h1>
      <p className="mt-2 text-muted-foreground">
        Browse license-gated models &amp; datasets.
      </p>

      <div className="mt-6 space-y-4">
        <Input
          placeholder="Search by title…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-md"
        />

        <div className="flex flex-wrap gap-2">
          {TRAINING_STAGES.map((s) => (
            <Chip key={s} active={stages.has(s)} onClick={() => toggleStage(s)}>
              {TRAINING_STAGE_LABELS[s]}
            </Chip>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {PRICE_BUCKETS.map((b) => (
            <Chip key={b.key} active={bucket === b.key} onClick={() => setBucket(b.key)}>
              {b.label}
            </Chip>
          ))}
          <span className="mx-1 h-5 w-px bg-border" />
          <Chip active={sampleOnly} onClick={() => setSampleOnly((v) => !v)}>
            Has sample
          </Chip>
        </div>
      </div>

      <div className="mt-8">
        {loading ? (
          <p className="text-sm text-muted-foreground">Loading listings…</p>
        ) : error ? (
          <p className="text-sm text-red-500">{error}</p>
        ) : filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No listings match your filters.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filtered.map((l) => (
              <ListingCard key={l.id} listing={l} />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
