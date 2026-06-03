import { NextResponse } from "next/server";
import { uploadSampleToIpfs } from "@/lib/server/ipfs";

export const runtime = "nodejs";

/** Pins the plaintext sample preview to IPFS (Node Helia) and returns its CID. */
export async function POST(req: Request): Promise<Response> {
  const bytes = new Uint8Array(await req.arrayBuffer());
  if (bytes.byteLength === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  const sampleCid = await uploadSampleToIpfs(bytes);
  return NextResponse.json({ sampleCid });
}
