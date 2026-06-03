import "server-only";

import { createPublicClient, http, parseEther } from "viem";
import { storyAeneid } from "@/lib/chains";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { LICENSE_TOKEN, type TrainingStage } from "@/lib/onchain/addresses";
import { formatIP } from "@/lib/utils";
import type { Listing, Purchase } from "@/lib/supabase/types";
import type { ReceiptData, ReceiptStatus } from "@/lib/receipt";

const RPC = process.env.NEXT_PUBLIC_STORY_RPC_URL ?? "https://aeneid.storyrpc.io";

const ERC721_OWNER_OF = [
  {
    name: "ownerOf",
    type: "function",
    stateMutability: "view",
    inputs: [{ name: "tokenId", type: "uint256" }],
    outputs: [{ name: "", type: "address" }],
  },
] as const;

async function build(purchase: Purchase, listing: Listing): Promise<ReceiptData> {
  const publicClient = createPublicClient({ chain: storyAeneid, transport: http(RPC) });
  const licenseTokenAddress = (listing.license_token_address ??
    LICENSE_TOKEN) as `0x${string}`;

  // 1. Confirm the tx exists on-chain + read its block.
  let blockNumber: string | null = null;
  let blockTimestamp: string | null = null;
  let txExists = false;
  try {
    const receipt = await publicClient.getTransactionReceipt({
      hash: purchase.tx_hash as `0x${string}`,
    });
    txExists = true;
    blockNumber = receipt.blockNumber.toString();
    try {
      const block = await publicClient.getBlock({ blockNumber: receipt.blockNumber });
      blockTimestamp = new Date(Number(block.timestamp) * 1000).toISOString();
    } catch {
      /* block lookup best-effort */
    }
  } catch {
    txExists = false;
  }

  // 2. Who currently holds the license token?
  let currentLicenseHolder: string | null = null;
  if (purchase.license_token_id) {
    try {
      const owner = await publicClient.readContract({
        address: licenseTokenAddress,
        abi: ERC721_OWNER_OF,
        functionName: "ownerOf",
        args: [BigInt(purchase.license_token_id)],
      });
      currentLicenseHolder = owner as string;
    } catch {
      // ownerOf reverts when the token was burned / never existed.
      currentLicenseHolder = null;
    }
  }

  // 3. Reconcile DB claim vs on-chain reality.
  let status: ReceiptStatus;
  if (!txExists) {
    status = "invalid";
  } else if (
    currentLicenseHolder &&
    currentLicenseHolder.toLowerCase() === purchase.buyer_address.toLowerCase()
  ) {
    status = "verified";
  } else {
    status = "transferred"; // moved to another wallet or burned
  }

  const priceIp = listing.price_ip != null ? Number(listing.price_ip) : null;
  let priceWei = "0";
  try {
    priceWei = priceIp != null ? parseEther(String(priceIp)).toString() : "0";
  } catch {
    priceWei = "0";
  }

  return {
    txHash: purchase.tx_hash ?? "",
    listingId: listing.id,
    buyerAddress: purchase.buyer_address,
    sellerAddress: listing.seller_address,
    title: listing.title,
    description: listing.description,
    trainingStage: listing.training_stage as TrainingStage | null,
    ipId: listing.ip_id,
    vaultId: listing.main_vault_id,
    expiresAt: listing.expires_at,
    listingCreatedAt: listing.created_at,
    licenseTokenId: purchase.license_token_id,
    licenseTokenAddress,
    licenseTermsId: listing.license_terms_id,
    priceIp,
    priceWei,
    priceFormatted: formatIP(priceIp),
    purchasedAt: purchase.created_at,
    blockNumber,
    blockTimestamp,
    status,
    currentLicenseHolder,
    checkedAt: new Date().toISOString(),
  };
}

export async function getReceiptByTxHash(txHash: string): Promise<ReceiptData | null> {
  const supabase = createSupabaseServerClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("tx_hash", txHash)
    .maybeSingle();
  if (!purchase) return null;
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", purchase.listing_id)
    .maybeSingle();
  if (!listing) return null;
  return build(purchase, listing);
}

export async function getReceiptByLicenseId(
  licenseTokenId: string,
): Promise<ReceiptData | null> {
  const supabase = createSupabaseServerClient();
  const { data: purchase } = await supabase
    .from("purchases")
    .select("*")
    .eq("license_token_id", licenseTokenId)
    .maybeSingle();
  if (!purchase || !purchase.tx_hash) return null;
  const { data: listing } = await supabase
    .from("listings")
    .select("*")
    .eq("id", purchase.listing_id)
    .maybeSingle();
  if (!listing) return null;
  return build(purchase, listing);
}
