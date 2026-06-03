import "server-only";

import { createHelia } from "helia";
import { unixfs } from "@helia/unixfs";

/**
 * Add bytes to IPFS via a short-lived Node Helia node and return the CID. Runs
 * server-side because Helia's default browser transport pulls Node built-ins
 * that don't bundle for the browser.
 */
export async function uploadSampleToIpfs(bytes: Uint8Array): Promise<string> {
  const helia = await createHelia();
  try {
    const fs = unixfs(helia);
    const cid = await fs.addBytes(bytes);
    return cid.toString();
  } finally {
    await helia.stop();
  }
}
