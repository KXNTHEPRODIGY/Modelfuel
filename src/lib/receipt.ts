import type { TrainingStage } from "@/lib/onchain/addresses";

export type ReceiptStatus = "verified" | "transferred" | "invalid";

/** Fully-serialized receipt data passed from server components to the client. */
export interface ReceiptData {
  txHash: string;
  listingId: string;
  // parties
  buyerAddress: string;
  sellerAddress: string;
  // dataset
  title: string;
  description: string | null;
  trainingStage: TrainingStage | null;
  ipId: string | null;
  vaultId: string | null;
  expiresAt: string | null;
  listingCreatedAt: string;
  // license
  licenseTokenId: string | null;
  licenseTokenAddress: string;
  licenseTermsId: string | null;
  // purchase
  priceIp: number | null;
  priceWei: string;
  priceFormatted: string;
  purchasedAt: string;
  // on-chain verification
  blockNumber: string | null;
  blockTimestamp: string | null;
  status: ReceiptStatus;
  currentLicenseHolder: string | null;
  checkedAt: string;
}

export const STATUS_META: Record<
  ReceiptStatus,
  { label: string; icon: string }
> = {
  verified: { label: "Verified on Story Aeneid", icon: "✓" },
  transferred: { label: "License Transferred", icon: "↻" },
  invalid: { label: "Invalid", icon: "✗" },
};

export function siteUrl(): string {
  return (process.env.NEXT_PUBLIC_SITE_URL ?? "https://modelfuel.xyz").replace(
    /\/+$/,
    "",
  );
}

export function receiptUrl(txHash: string): string {
  return `${siteUrl()}/receipt/${txHash}`;
}

export function listingUrl(listingId: string): string {
  return `${siteUrl()}/listing/${listingId}`;
}

/** Canonical v1 JSON export shape (also used by the JSON download button). */
export function buildReceiptJson(d: ReceiptData) {
  return {
    $schema: "https://modelfuel.xyz/schemas/receipt-v1.json",
    issuer: "modelfuel.xyz",
    schemaVersion: 1,
    issuedAt: new Date().toISOString(),
    receipt: {
      txHash: d.txHash,
      blockNumber: d.blockNumber ? Number(d.blockNumber) : null,
      chain: { name: "Story Aeneid", chainId: 1315 },
      parties: { seller: d.sellerAddress, buyer: d.buyerAddress },
      dataset: {
        title: d.title,
        trainingStage: d.trainingStage,
        ipId: d.ipId,
        vaultId: d.vaultId,
        listingUrl: listingUrl(d.listingId),
      },
      license: {
        tokenId: d.licenseTokenId,
        tokenAddress: d.licenseTokenAddress,
        termsId: d.licenseTermsId,
      },
      purchase: {
        pricePaid: d.priceWei,
        priceFormatted: d.priceFormatted,
        purchasedAt: d.purchasedAt,
      },
      verification: {
        status: d.status,
        currentLicenseHolder: d.currentLicenseHolder,
        checkedAt: d.checkedAt,
      },
    },
  };
}
