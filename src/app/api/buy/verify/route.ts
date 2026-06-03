import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const schema = z.object({ listingId: z.string().uuid() });

/**
 * Authoritative server-side re-check that a listing is purchasable (active +
 * not expired) right before the client mints a license. Returns the on-chain
 * params the client needs (ipId, licenseTermsId).
 */
export async function POST(req: Request): Promise<Response> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid listingId" }, { status: 400 });
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .select("status, expires_at, ip_id, license_terms_id, price_ip")
    .eq("id", parsed.data.listingId)
    .maybeSingle();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!data) return NextResponse.json({ error: "Listing not found" }, { status: 404 });
  if (data.status !== "active") {
    return NextResponse.json({ error: "Listing is not active" }, { status: 409 });
  }
  if (data.expires_at && new Date(data.expires_at).getTime() < Date.now()) {
    return NextResponse.json({ error: "Listing has expired" }, { status: 409 });
  }

  return NextResponse.json({
    ipId: data.ip_id,
    licenseTermsId: data.license_terms_id,
    priceIp: data.price_ip,
  });
}
