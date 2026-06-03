"use client";

import { parseEther, type WalletClient } from "viem";
import { createStoryClient } from "@/lib/onchain/story";
import {
  DEFAULT_COMMERCIAL_REV_SHARE,
  ROYALTY_POLICY_LAP,
  SPG_NFT_CONTRACT,
  WIP_TOKEN_ADDRESS,
} from "@/lib/onchain/addresses";

/** Accumulated outputs threaded through the sell sequence (so it can resume). */
export type SellContext = {
  ipId?: `0x${string}`;
  licenseTermsId?: string;
  vaultUuid?: number;
  storagePath?: string;
  sampleCid?: string;
  listingId?: string;
};

async function readError(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return typeof body?.error === "string" ? body.error : JSON.stringify(body?.error);
  } catch {
    return `${res.status} ${res.statusText}`;
  }
}

/** Uint8Array → plain ArrayBuffer (a valid fetch BodyInit under current TS libs). */
function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  const buf = new ArrayBuffer(bytes.byteLength);
  new Uint8Array(buf).set(bytes);
  return buf;
}

// ── Step 1 (client / seller wallet): mint + register the Story IP Asset ───────
export async function stepRegisterIp(
  wallet: WalletClient,
  sellerAddress: `0x${string}`,
): Promise<{ ipId: `0x${string}`; txHash: string }> {
  if (!SPG_NFT_CONTRACT) {
    throw new Error(
      "NEXT_PUBLIC_SPG_NFT_CONTRACT is not set — create an SPG NFT collection and set its address.",
    );
  }
  const story = createStoryClient(wallet);
  const res = await story.ipAsset.mintAndRegisterIp({
    spgNftContract: SPG_NFT_CONTRACT,
    recipient: sellerAddress,
    allowDuplicates: true,
  });
  if (!res.ipId) throw new Error("IP registration returned no ipId");
  return { ipId: res.ipId as `0x${string}`, txHash: res.txHash ?? "" };
}

// ── Step 2 (client / seller wallet): register a commercial-remix PIL + attach ─
export async function stepAttachLicense(
  wallet: WalletClient,
  ipId: `0x${string}`,
  priceIp: number,
): Promise<{ licenseTermsId: string; registerTxHash: string; attachTxHash?: string }> {
  const story = createStoryClient(wallet);
  const reg = await story.license.registerCommercialRemixPIL({
    defaultMintingFee: parseEther(String(priceIp)),
    commercialRevShare: DEFAULT_COMMERCIAL_REV_SHARE,
    currency: WIP_TOKEN_ADDRESS,
    royaltyPolicyAddress: ROYALTY_POLICY_LAP,
  });
  if (reg.licenseTermsId === undefined) {
    throw new Error("PIL registration returned no licenseTermsId");
  }
  const attach = await story.license.attachLicenseTerms({
    ipId,
    licenseTermsId: reg.licenseTermsId,
  });
  return {
    licenseTermsId: reg.licenseTermsId.toString(),
    registerTxHash: reg.txHash ?? "",
    attachTxHash: attach.txHash,
  };
}

// ── Step 3 (server): allocate the CDR vault ───────────────────────────────────
export async function stepAllocateVault(
  ipId: `0x${string}`,
): Promise<{ vaultUuid: number; txHash: string }> {
  const res = await fetch("/api/sell/allocate-vault", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ ipId }),
  });
  if (!res.ok) throw new Error(`Vault allocation failed: ${await readError(res)}`);
  return (await res.json()) as { vaultUuid: number; txHash: string };
}

// ── Step 4 (server): encrypt main file → Supabase + threshold-write to vault ──
export async function stepEncryptAndStore(
  vaultUuid: number,
  mainFile: Uint8Array,
): Promise<{ storagePath: string; txHash: string }> {
  const res = await fetch(`/api/sell/encrypt-store?uuid=${vaultUuid}`, {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: toArrayBuffer(mainFile),
  });
  if (!res.ok) throw new Error(`Encrypt/store failed: ${await readError(res)}`);
  return (await res.json()) as { storagePath: string; txHash: string };
}

// ── Step 5 (server): upload the optional sample to IPFS ───────────────────────
export async function stepUploadSample(
  sampleFile: Uint8Array,
): Promise<{ sampleCid: string }> {
  const res = await fetch("/api/sell/upload-sample", {
    method: "POST",
    headers: { "content-type": "application/octet-stream" },
    body: toArrayBuffer(sampleFile),
  });
  if (!res.ok) throw new Error(`Sample upload failed: ${await readError(res)}`);
  return (await res.json()) as { sampleCid: string };
}

// ── Step 6 (server): persist the listing row ──────────────────────────────────
export type CreateListingPayload = {
  seller_address: string;
  title: string;
  description: string | null;
  price_ip: number;
  training_stage: string;
  main_vault_id: string;
  ip_id: string;
  license_terms_id: string;
  license_token_address: string;
  sample_cid: string | null;
  expires_at: string | null;
};

export async function stepCreateListing(
  payload: CreateListingPayload,
): Promise<{ listingId: string }> {
  const res = await fetch("/api/listings", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error(`Listing insert failed: ${await readError(res)}`);
  const { id } = (await res.json()) as { id: string };
  return { listingId: id };
}
