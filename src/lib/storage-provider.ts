"use client";

import type { StorageProvider } from "@piplabs/cdr-sdk";

/**
 * Browser StorageProvider for the CDR consumer. It can't read the private
 * Supabase bucket directly, so `download` asks a server route for a short-lived
 * signed URL and fetches the (already-encrypted) bytes. Only ciphertext crosses
 * the wire — the AES key and plaintext never touch the server.
 */
export function createSignedUrlStorageProvider(): StorageProvider {
  return {
    async upload(): Promise<string> {
      throw new Error("Uploads are server-side only.");
    },
    async download(cid: string): Promise<Uint8Array> {
      const res = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: cid }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => null);
        throw new Error(j?.error ?? `signed-url failed (${res.status})`);
      }
      const { signedUrl } = (await res.json()) as { signedUrl: string };
      const fileRes = await fetch(signedUrl);
      if (!fileRes.ok) throw new Error(`ciphertext fetch failed (${fileRes.status})`);
      return new Uint8Array(await fileRes.arrayBuffer());
    },
  };
}
