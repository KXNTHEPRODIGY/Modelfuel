import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { toHex } from "viem";
import { encryptFile, uuidToLabel } from "@piplabs/cdr-sdk";
import { createServerCdrClient, ensureCdrWasm } from "@/lib/server/cdr";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

/**
 * AES-encrypts the (plaintext) main dataset, stores the ciphertext in the
 * private Supabase bucket, then threshold-encrypts the {path, key} reference
 * into the vault under its UUID-derived label and writes it on-chain.
 *
 * The plaintext file is only held in memory here and never persisted in the
 * clear. Body = raw file bytes; `?uuid=` = the vault id from allocate-vault.
 *
 * TODO(auth): verify the Privy access token before accepting the upload.
 */
export async function POST(req: Request): Promise<Response> {
  const uuid = Number(new URL(req.url).searchParams.get("uuid"));
  if (!Number.isInteger(uuid)) {
    return NextResponse.json({ error: "Missing/invalid uuid" }, { status: 400 });
  }

  const fileBytes = new Uint8Array(await req.arrayBuffer());
  if (fileBytes.byteLength === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }

  await ensureCdrWasm();
  const { client } = createServerCdrClient();

  const { ciphertext: encryptedFile, key: aesKey } = encryptFile(fileBytes);

  const bucket = process.env.SUPABASE_BUCKET ?? "modelfuel-encrypted";
  const supabase = createSupabaseServerClient();
  const path = `cdr/${randomUUID()}.bin`;
  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, Buffer.from(encryptedFile), {
      contentType: "application/octet-stream",
      upsert: false,
    });
  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const globalPubKey = await client.observer.getGlobalPubKey();
  const payload = new TextEncoder().encode(
    JSON.stringify({ cid: path, key: toHex(aesKey) }),
  );
  const ciphertext = await client.uploader.encryptDataKey({
    dataKey: payload,
    globalPubKey,
    label: uuidToLabel(uuid),
  });
  const { txHash } = await client.uploader.write({
    uuid,
    accessAuxData: "0x",
    encryptedData: toHex(ciphertext.raw),
  });

  return NextResponse.json({ storagePath: path, txHash });
}
