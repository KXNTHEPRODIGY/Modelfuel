import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const patchSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("delist") }),
  z.object({ action: z.literal("extend"), days: z.number().int().positive().max(3650) }),
]);

/**
 * Seller management actions on a listing (delist / extend expiry). Uses the
 * service-role client (bypasses RLS).
 *
 * TODO(auth): verify the Privy access token and that the caller owns
 * listings.seller_address before mutating.
 */
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } },
): Promise<Response> {
  const parsed = patchSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { id } = params;

  if (parsed.data.action === "delist") {
    const { data, error } = await supabase
      .from("listings")
      .update({ status: "delisted" })
      .eq("id", id)
      .select("*")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ listing: data });
  }

  // extend: add `days` onto the later of now / current expiry
  const { data: current, error: readErr } = await supabase
    .from("listings")
    .select("expires_at")
    .eq("id", id)
    .single();
  if (readErr) return NextResponse.json({ error: readErr.message }, { status: 500 });

  const currentMs = current.expires_at ? new Date(current.expires_at).getTime() : 0;
  const base = Math.max(currentMs, Date.now());
  const newExpiry = new Date(base + parsed.data.days * 86_400_000).toISOString();

  const { data, error } = await supabase
    .from("listings")
    .update({ expires_at: newExpiry })
    .eq("id", id)
    .select("*")
    .single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ listing: data });
}
