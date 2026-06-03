import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { TRAINING_STAGES } from "@/lib/onchain/addresses";

export const runtime = "nodejs";

const listingSchema = z.object({
  seller_address: z.string().min(1),
  title: z.string().min(1),
  description: z.string().nullish(),
  price_ip: z.number().nonnegative(),
  training_stage: z.enum(TRAINING_STAGES),
  main_vault_id: z.string().min(1),
  ip_id: z.string().min(1),
  license_terms_id: z.string().min(1),
  license_token_address: z.string().min(1),
  sample_cid: z.string().nullish(),
  expires_at: z.string().datetime().nullish(),
});

/**
 * Inserts a listing row. Uses the service-role client, which bypasses RLS.
 *
 * TODO(auth): verify the Privy access token and require that seller_address
 * matches the verified wallet before inserting.
 */
export async function POST(req: Request): Promise<Response> {
  const parsed = listingSchema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase
    .from("listings")
    .insert({ ...parsed.data, status: "active" })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ id: data.id });
}
