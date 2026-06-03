import "server-only";

import { CDRClient, initWasm } from "@piplabs/cdr-sdk";
import {
  createPublicClient,
  createWalletClient,
  http,
  type PrivateKeyAccount,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";
import { storyAeneid } from "@/lib/chains";

const RPC_URL =
  process.env.NEXT_PUBLIC_STORY_RPC_URL ?? "https://aeneid.storyrpc.io";
const API_URL = process.env.STORY_API_URL ?? "http://172.192.41.96:1317";

let wasmReady: Promise<unknown> | undefined;

/** Initialize CDR WASM crypto once per server process. */
export function ensureCdrWasm(): Promise<unknown> {
  wasmReady ??= initWasm();
  return wasmReady;
}

/** The platform dev wallet that signs CDR vault txs (the vault's write owner). */
export function getServerAccount(): PrivateKeyAccount {
  const pk = process.env.WALLET_PRIVATE_KEY;
  if (!pk || !/^0x[0-9a-fA-F]{64}$/.test(pk)) {
    throw new Error(
      "WALLET_PRIVATE_KEY is missing or not a 32-byte hex key — set it in .env.local",
    );
  }
  return privateKeyToAccount(pk as `0x${string}`);
}

/** Server-side CDR client (Node only — the SDK's WASM is not browser-safe). */
export function createServerCdrClient(): {
  client: CDRClient;
  account: PrivateKeyAccount;
} {
  const account = getServerAccount();
  const publicClient = createPublicClient({
    chain: storyAeneid,
    transport: http(RPC_URL),
  });
  const walletClient = createWalletClient({
    account,
    chain: storyAeneid,
    transport: http(RPC_URL),
  });
  const client = new CDRClient({
    network: "testnet",
    publicClient,
    walletClient,
    apiUrl: API_URL,
  });
  return { client, account };
}
