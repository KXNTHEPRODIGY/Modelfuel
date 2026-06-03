<div align="center">
  <img src="public-logo.png" alt="Modelfuel" width="120" />
  <h1>Modelfuel</h1>
  <p><strong>The encrypted marketplace for AI-grade data.</strong></p>
  <p>Sell your dataset. Keep your IP. Settle on-chain.</p>
  <p><a href="https://modelfuel.xyz">modelfuel.xyz</a></p>
</div>

---

## What is Modelfuel?

Modelfuel is a marketplace where data owners sell AI training datasets without ever exposing them. Files are encrypted client-side and stored in Story's **Confidential Data Rails (CDR)** vaults — they only decrypt for buyers who hold a valid on-chain license. Every dataset is registered as a Story IP Asset, so ownership, royalties, and resale are enforced by the protocol instead of by trust.

## Why it matters

The biggest threat to IP is AI. The moment your data is on the public internet, a model is probably training on it — without your permission, attribution, or payment. Existing decentralized storage offers availability but not confidentiality, and Web2 dataset platforms force creators to trust intermediaries with their raw files. Modelfuel fixes both: datasets are encrypted before they leave the seller's device, the decryption key is sharded across Story's validator network, and access is gated by an on-chain license token.

## How CDR powers it

- **Encrypted at upload.** Every dataset is AES-GCM encrypted in the seller's browser before it leaves the device. The AES key is then wrapped under the CDR validator network's threshold public key — no single party, including Modelfuel, ever holds it.
- **License is the decryption key.** Each dataset's CDR vault is configured with Story's `LicenseReadCondition`, encoded with the dataset's IP ID and license token address. Without a valid license token in the buyer's wallet, the read condition fails and the file stays cryptographically locked.
- **Threshold decryption, client-side combine.** When a license holder requests a download, the CDR validator committee produces partial decryption shares inside hardware-isolated TEEs. The buyer's browser collects the threshold of shares, combines them via Lagrange interpolation to recover the AES key, and decrypts the file locally. The Modelfuel backend handles zero plaintext.

## Features

- Encrypted dataset listings labeled by training stage (Pretraining, SFT, RLHF, DPO, Eval, Other)
- Optional public sample preview so buyers can evaluate quality before purchase
- On-chain IP registration via Story Protocol's Programmable IP License (PIL)
- One-transaction buy flow: payment in $IP, license mint, and access unlock are atomic
- Time-limited listings with seller-controlled expiry
- Privy login with email, Google, or external wallet — embedded wallet support out of the box
- Personal library page showing every dataset a wallet has licensed

## Tech stack

- **Frontend:** Next.js 14 (App Router), TypeScript, Tailwind, shadcn/ui, Framer Motion
- **Auth & wallet:** [Privy](https://privy.io)
- **Blockchain:** [Story Protocol](https://story.foundation) (Aeneid testnet, chainId 1315)
- **Confidentiality:** [`@piplabs/cdr-sdk`](https://www.npmjs.com/package/@piplabs/cdr-sdk) — Confidential Data Rails
- **IP layer:** `@story-protocol/core-sdk`
- **Storage:** Supabase (Postgres + private Storage bucket) for ciphertext and metadata; Helia for IPFS-backed sample previews
- **Contract calls:** viem + wagmi

## Architecture

```
┌────────────────┐    encrypted     ┌──────────────────┐
│   Seller UI    │ ────────────────▶│  Supabase Bucket │   (ciphertext)
│   (Next.js)    │                  └──────────────────┘
└────────┬───────┘
         │ TDH2(AES key) + read condition
         ▼
┌─────────────────┐                  ┌─────────────────────┐
│  CDR Vault on   │ ◀────────────────│  Story Validators   │
│   Story L1      │  partial decrypt │  (TEE kernels)      │
└────────┬────────┘                  └─────────────────────┘
         │ verifies license token
         ▼

The seller encrypts the dataset client-side, uploads ciphertext to Supabase Storage, and registers the dataset as a Story IP Asset with a CDR vault gated by the resulting license. Buyers mint a license token in a single Story transaction. To download, the buyer's wallet requests a read against the vault; validators verify the license on-chain and produce partial decryption shares; the buyer's browser combines them to recover the AES key and decrypts the file locally.
```
## Getting started

### Prerequisites

- Node.js 22+ (Helia requires it)
- pnpm (or npm/yarn)
- A funded wallet on [Story Aeneid testnet](https://aeneid.faucet.story.foundation/)
- A [Privy](https://dashboard.privy.io) app
- A [Supabase](https://supabase.com) project (free tier works)

```


### Environment variables

```env
# Privy
NEXT_PUBLIC_PRIVY_APP_ID=
PRIVY_APP_SECRET=

# Story Protocol / Aeneid
NEXT_PUBLIC_STORY_RPC_URL=https://aeneid.storyrpc.io
NEXT_PUBLIC_STORY_CHAIN_ID=1315
STORY_API_URL=
NEXT_PUBLIC_STORY_API_URL=
NEXT_PUBLIC_SPG_NFT_CONTRACT=

# Supabase
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_BUCKET=modelfuel-encrypted
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Project structure

```
modelfuel/
├── app/                     # Next.js routes
│   ├── page.tsx             # Landing page
│   ├── market/              # Browse datasets
│   ├── listing/[id]/        # Dataset detail + buy
│   ├── sell/                # List a dataset
│   ├── my/                  # Library + listings
│   └── api/                 # Server route handlers
├── src/
│   └── lib/                 # CDR client, Story client, Supabase, Privy
├── supabase/
│   └── migrations/          # DB schema
├── scripts/
│   └── create-spg-collection.mjs
├── public/
│   └── logo.svg
└── .env.example
```
## Links

- Site: [modelfuel.xyz](https://modelfuel.xyz)
- Story CDR whitepaper: [confidentialdatarails.pdf](https://www.story.foundation/confidentialdatarails.pdf)
- CDR SDK docs: [docs.story.foundation/developers/cdr-sdk/overview](https://docs.story.foundation/developers/cdr-sdk/overview)
- Story Protocol: [story.foundation](https://www.story.foundation)
- Aeneid faucet: [aeneid.faucet.story.foundation](https://aeneid.faucet.story.foundation/)

## Acknowledgments

Built on Story Protocol, powered by Confidential Data Rails. Inspired by the CDR reference examples at [jacob-tucker/cdr-skill](https://github.com/jacob-tucker/cdr-skill).


│  Buyer Wallet   │ ───── mint ─────▶│  Story Licensing    │
│   (Privy/EOA)   │
