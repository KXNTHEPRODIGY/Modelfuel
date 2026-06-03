import { defineChain } from "viem";

/**
 * Story "Aeneid" testnet chain id. Defaults to 1315 but is read from env so a
 * deployment can repoint without code changes. Used by both CDR (vault txs) and
 * Story Protocol (IP / license txs).
 */
export const STORY_AENEID_CHAIN_ID = Number(
  process.env.NEXT_PUBLIC_STORY_CHAIN_ID ?? "1315",
);

const RPC_URL =
  process.env.NEXT_PUBLIC_STORY_RPC_URL ?? "https://aeneid.storyrpc.io";

/**
 * Story L1 "Aeneid" testnet as a viem `Chain`. Both the CDR SDK and the Story
 * core SDK consume a viem wallet/public client built against this chain.
 */
export const storyAeneid = defineChain({
  id: STORY_AENEID_CHAIN_ID,
  name: "Story Aeneid Testnet",
  nativeCurrency: { name: "IP", symbol: "IP", decimals: 18 },
  rpcUrls: {
    default: { http: [RPC_URL] },
  },
  blockExplorers: {
    default: { name: "Storyscan", url: "https://aeneid.storyscan.io" },
  },
  testnet: true,
});
