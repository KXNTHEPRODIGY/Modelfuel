"use client";

import { StoryClient, type StoryConfig } from "@story-protocol/core-sdk";
import { http, type WalletClient } from "viem";

const RPC_URL =
  process.env.NEXT_PUBLIC_STORY_RPC_URL ?? "https://aeneid.storyrpc.io";

/**
 * Story SDK client bound to the seller's Privy wallet. The wallet signs writes
 * (mint/register IP, register + attach PIL); reads go over the public RPC.
 */
export function createStoryClient(walletClient: WalletClient): StoryClient {
  return StoryClient.newClient({
    // viem WalletClient satisfies the SDK's SimpleWalletClient surface.
    wallet: walletClient as StoryConfig["wallet"],
    transport: http(RPC_URL),
    chainId: "aeneid",
  });
}
