import type { ReactNode } from "react";
import type { Listing } from "@/lib/supabase/types";
import { TRAINING_STAGE_LABELS, type TrainingStage } from "@/lib/onchain/addresses";

export function ListingCard({
  listing,
  badge,
}: {
  listing: Listing;
  badge?: ReactNode;
}) {
  const stageLabel = listing.training_stage
    ? TRAINING_STAGE_LABELS[listing.training_stage as TrainingStage]
    : "—";

  return (
    <a
      href={`/listing/${listing.id}`}
      className="flex flex-col rounded-lg border p-4 transition-colors hover:bg-muted/40"
    >
      <div className="flex items-start justify-between gap-2">
        <h3 className="line-clamp-1 font-medium">{listing.title}</h3>
        <div className="flex shrink-0 items-center gap-1">
          {badge}
          {listing.sample_cid && (
            <span className="rounded-full border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
              sample
            </span>
          )}
        </div>
      </div>
      {listing.description && (
        <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
          {listing.description}
        </p>
      )}
      <div className="mt-4 flex items-center justify-between">
        <span className="rounded bg-muted px-2 py-0.5 text-xs text-muted-foreground">
          {stageLabel}
        </span>
        <span className="text-sm font-semibold">{listing.price_ip ?? 0} $IP</span>
      </div>
    </a>
  );
}
