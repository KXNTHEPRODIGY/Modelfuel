"use client";

import { useCallback, useEffect, useState } from "react";
import { createWalletClient, custom, type WalletClient } from "viem";
import { useActiveWallet } from "@privy-io/react-auth";
import { storyAeneid, STORY_AENEID_CHAIN_ID } from "@/lib/chains";

/**
 * Wires a viem `WalletClient` to Privy's active wallet (embedded or external)
 * on Story Aeneid. The same client signs both CDR vault txs and Story Protocol
 * IP / license txs — both SDKs accept a viem `WalletClient`.
 *
 * Uses the wallet's EIP-1193 provider via `custom(...)` transport, so it works
 * the same for an auto-created embedded wallet and a linked external wallet.
 */
export function useStoryWalletClient() {
  const { wallet } = useActiveWallet();
  const [walletClient, setWalletClient] = useState<WalletClient | null>(null);

  const address =
    wallet?.type === "ethereum"
      ? (wallet.address as `0x${string}`)
      : undefined;

  const buildClient = useCallback(async (): Promise<WalletClient | null> => {
    if (!wallet || wallet.type !== "ethereum") return null;

    // Ensure the wallet is on Story Aeneid before signing. chainId is CAIP-2,
    // e.g. "eip155:1315".
    if (wallet.chainId !== `eip155:${STORY_AENEID_CHAIN_ID}`) {
      await wallet.switchChain(STORY_AENEID_CHAIN_ID);
    }

    const provider = await wallet.getEthereumProvider();
    return createWalletClient({
      account: wallet.address as `0x${string}`,
      chain: storyAeneid,
      transport: custom(provider),
    });
  }, [wallet]);

  // Keep a ready-to-use client in state as the active wallet changes.
  useEffect(() => {
    let cancelled = false;
    buildClient()
      .then((client) => {
        if (!cancelled) setWalletClient(client);
      })
      .catch(() => {
        if (!cancelled) setWalletClient(null);
      });
    return () => {
      cancelled = true;
    };
  }, [buildClient]);

  return {
    /** Connected EOA / embedded-wallet address, if any. */
    address,
    /** True once a signer is wired for the active wallet. */
    ready: Boolean(walletClient),
    /** Memoized viem WalletClient (null until a wallet is connected). */
    walletClient,
    /**
     * Imperatively (re)build a chain-checked WalletClient. Prefer this inside
     * tx handlers so the Aeneid chain switch is awaited right before signing.
     */
    getWalletClient: buildClient,
  };
}
