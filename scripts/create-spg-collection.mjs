// One-time setup: create a public SPG NFT collection on Story Aeneid that
// /sell mints the IP NFT from. Run once, then paste the printed address into
// NEXT_PUBLIC_SPG_NFT_CONTRACT in .env.local.
//
//   node --env-file=.env.local scripts/create-spg-collection.mjs
//
// Requires a real, funded WALLET_PRIVATE_KEY (needs testnet IP for gas).
import { StoryClient } from "@story-protocol/core-sdk";
import { http, zeroAddress } from "viem";
import { privateKeyToAccount } from "viem/accounts";

const PK = process.env.WALLET_PRIVATE_KEY;
if (!PK || !/^0x[0-9a-fA-F]{64}$/.test(PK)) {
  console.error(
    "Set a real 32-byte hex WALLET_PRIVATE_KEY in .env.local (funded with Aeneid testnet IP).",
  );
  process.exit(1);
}

const RPC = process.env.NEXT_PUBLIC_STORY_RPC_URL ?? "https://aeneid.storyrpc.io";
const account = privateKeyToAccount(PK);
const client = StoryClient.newClient({
  account,
  transport: http(RPC),
  chainId: "aeneid",
});

console.log(`Creating SPG NFT collection from ${account.address} …`);
const res = await client.nftClient.createNFTCollection({
  name: "ModelFuel Datasets",
  symbol: "MFD",
  isPublicMinting: true, // sellers (any wallet) can mint their IP NFT
  mintOpen: true,
  mintFeeRecipient: zeroAddress,
  contractURI: "",
});

console.log("\n✓ Created.");
console.log("  spgNftContract:", res.spgNftContract);
console.log("  txHash:", res.txHash);
console.log("\nAdd this to .env.local (then restart the dev server):");
console.log(`NEXT_PUBLIC_SPG_NFT_CONTRACT=${res.spgNftContract}`);
