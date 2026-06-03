import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const insertSchema = z.object({
  listing_id: z.string().uuid(),
  buyer_address: z.string().min(1),
  license_token_id: z.string().min(1).nullish(),
  tx_hash: z.string().min(1).nullish(),
});

/**
 * Record a purchase after a successful on-chain license mint. Service-role
 * (anon RLS has no insert policy for purchases).
 *
 * TODO(auth): verify the Privy token and that buyer_address is the caller.
 */
export async function POST(req: Request): Promise<Response> {
  const parsed = insertSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("purchases")
    .insert(parsed.data)
    .select("id")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ id: data.id });
}

/**
 * List a buyer's purchases joined with their listings. Service-role, since the
 * purchases RLS select policy needs a wallet_address JWT claim we don't mint.
 *
 * TODO(auth): verify the Privy token and that ?buyer is the caller.
 */
export async function GET(req: Request): Promise<Response> {
  const buyer = new URL(req.url).searchParams.get("buyer");
  if (!buyer) return NextResponse.json({ error: "Missing buyer" }, { status: 400 });

  const supabase = createSupabaseServerClient();
  const { data: purchases, error } = await supabase
    .from("purchases")
    .select("*")
    .ilike("buyer_address", buyer)
    .order("created_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const listingIds = Array.from(
    new Set((purchases ?? []).map((p) => p.listing_id)),
  );
  const byId: Record<string, unknown> = {};
  if (listingIds.length > 0) {
    const { data: listings, error: e2 } = await supabase
      .from("listings")
      .select("*")
      .in("id", listingIds);
    if (e2) return NextResponse.json({ error: e2.message }, { status: 500 });
    for (const l of listings ?? []) byId[l.id] = l;
  }

  const rows = (purchases ?? []).map((p) => ({
    purchase: p,
    listing: byId[p.listing_id] ?? null,
  }));
  return NextResponse.json({ rows });
}
