// Story Aeneid (chain 1315) on-chain addresses + listing taxonomy.
// Story core addresses come from @story-protocol/core-sdk's address book;
// CDR condition contracts come from the cdr skill (SKILL.md).

export const STORY_AENEID_CHAIN_ID = 1315 as const;

/** $IP wrapper (ERC-20) used as the PIL minting-fee currency. */
export const WIP_TOKEN_ADDRESS =
  "0x1514000000000000000000000000000000000000" as const;
/** Liquid Absolute Percentage royalty policy. */
export const ROYALTY_POLICY_LAP =
  "0xBe54FB168b3c982b7AaE60dB6CF75Bd8447b390E" as const;
/** Story LicenseToken (ERC-721) — the token a buyer mints to unlock a vault. */
export const LICENSE_TOKEN =
  "0xFe3838BFb30B34170F00030B52eA4893d8aAC6bC" as const;

/** CDR OwnerWriteCondition (write gated to an owner address). */
export const OWNER_WRITE_CONDITION =
  "0x4C9bFC96d7092b590D497A191826C3dA2277c34B" as const;
/** CDR LicenseReadCondition (read gated to holders of a license token for an IP). */
export const LICENSE_READ_CONDITION =
  "0xC0640AD4CF2CaA9914C8e5C44234359a9102f7a3" as const;

/** Default % of derivative revenue shared back to the licensor for commercial-remix PILs. */
export const DEFAULT_COMMERCIAL_REV_SHARE = 5;

export const TRAINING_STAGES = [
  "pretraining",
  "sft",
  "rlhf",
  "dpo",
  "eval",
  "other",
] as const;
export type TrainingStage = (typeof TRAINING_STAGES)[number];

export const TRAINING_STAGE_LABELS: Record<TrainingStage, string> = {
  pretraining: "Pre-training",
  sft: "Supervised fine-tuning (SFT)",
  rlhf: "RLHF",
  dpo: "DPO",
  eval: "Evaluation",
  other: "Other",
};

/**
 * SPG NFT collection the seller's IP NFT is minted from. Create one once with
 * `client.nftClient.createNFTCollection(...)` (or use a public Aeneid SPG
 * collection) and set its address here.
 */
export const SPG_NFT_CONTRACT = process.env.NEXT_PUBLIC_SPG_NFT_CONTRACT as
  | `0x${string}`
  | undefined;

export function txExplorerUrl(hash: string): string {
  return `https://aeneid.storyscan.io/tx/${hash}`;
}

export function addressExplorerUrl(address: string): string {
  return `https://aeneid.storyscan.io/address/${address}`;
}

/** Story IP Asset explorer (the IP portal, not the raw block explorer). */
export function ipAssetExplorerUrl(ipId: string): string {
  return `https://aeneid.explorer.story.foundation/ipa/${ipId}`;
}
