"use client";

import { CDRClient, initWasm } from "@piplabs/cdr-sdk";
import { createPublicClient, http, type WalletClient } from "viem";
import { storyAeneid } from "@/lib/chains";

const RPC_URL =
  process.env.NEXT_PUBLIC_STORY_RPC_URL ?? "https://aeneid.storyrpc.io";
const API_URL =
  process.env.NEXT_PUBLIC_STORY_API_URL ?? "http://172.192.41.96:1317";

let wasmReady: Promise<unknown> | undefined;

/** Init the CDR WASM crypto once (browser fetch path). Required before decrypt. */
export function ensureCdrWasm(): Promise<unknown> {
  wasmReady ??= initWasm();
  return wasmReady;
}

/**
 * Browser CDR client bound to the buyer's wallet. The consumer signs the
 * license-gated read with the buyer's own wallet (works for embedded OR EOA),
 * so no server-side delegated signing is needed.
 */
export function createCdrClient(walletClient: WalletClient): CDRClient {
  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport: http(RPC_URL),
  });
  return new CDRClient({
    network: "testnet",
    publicClient,
    walletClient,
    apiUrl: API_URL,
  });
}
