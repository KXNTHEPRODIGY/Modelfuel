import { NextResponse } from "next/server";
import { z } from "zod";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Paths are the `cdr/<uuid>.bin` (ciphertext) or `samples/<uuid>.bin` (public
// preview) objects produced by the sell flow.
const schema = z.object({ path: z.string().regex(/^(?:cdr|samples)\/[\w.-]+$/) });

/**
 * Returns a short-lived signed URL for a ciphertext object in the private
 * bucket. Knowing a valid `cdr/*` path implies the caller already
 * threshold-decrypted the vault payload (which requires holding the license),
 * so this only ever exposes ciphertext.
 */
export async function POST(req: Request): Promise<Response> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid path" }, { status: 400 });
  }
  const bucket = process.env.SUPABASE_BUCKET ?? "modelfuel-encrypted";
  const supabase = createSupabaseServerClient();
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(parsed.data.path, 120);
  if (error || !data) {
    return NextResponse.json(
      { error: error?.message ?? "Failed to sign URL" },
      { status: 500 },
    );
  }
  return NextResponse.json({ signedUrl: data.signedUrl });
}
