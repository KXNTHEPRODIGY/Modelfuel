import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * Stores the plaintext sample preview in Supabase Storage and returns its path
 * (saved as listings.sample_cid). Samples are public previews — not gated — so
 * they're stored unencrypted under `samples/` and served to the detail page via
 * a short-lived signed URL. (Replaces the old Helia/IPFS upload, which can't be
 * served from a gateway when run in an ephemeral serverless function.)
 */
export async function POST(req: Request): Promise<Response> {
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  const bucket = process.env.SUPABASE_BUCKET ?? "modelfuel-encrypted";
  const supabase = createSupabaseServerClient();
  const path = `samples/${randomUUID()}.bin`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(bytes), {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sampleCid: path });
}
