import type { ReactNode } from "react";
import { GearLogo, StoryMark } from "@/components/brand/logos";
import { CopyButton } from "@/components/receipt/copy-button";
import { ExpandableText } from "@/components/receipt/expandable-text";
import { ReceiptActions } from "@/components/receipt/receipt-actions";
import {
  STATUS_META,
  type ReceiptData,
  type ReceiptStatus,
} from "@/lib/receipt";
import {
  TRAINING_STAGE_LABELS,
  addressExplorerUrl,
  ipAssetExplorerUrl,
  txExplorerUrl,
  type TrainingStage,
} from "@/lib/onchain/addresses";
import { shortAddress, shortHex, relativeTime } from "@/lib/utils";

const STATUS_STYLE: Record<ReceiptStatus, { color: string; bg: string }> = {
  verified: { color: "#FF6B1A", bg: "rgba(255,107,26,0.12)" },
  transferred: { color: "#EAB308", bg: "rgba(234,179,8,0.12)" },
  invalid: { color: "#EF4444", bg: "rgba(239,68,68,0.12)" },
};

function Party({ role, address }: { role: string; address: string }) {
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <p className="mb-1 font-mono text-xs uppercase tracking-widest text-white/40">{role}</p>
      <div className="flex items-center gap-1.5">
        <a
          href={addressExplorerUrl(address)}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono text-sm text-[#FAFAFA] hover:text-[#FF6B1A]"
        >
          {shortAddress(address)}
        </a>
        <CopyButton value={address} label={`Copy ${role} address`} />
      </div>
    </div>
  );
}

function Fact({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 border-b border-white/5 py-3 sm:flex-row sm:items-center sm:justify-between">
      <dt className="text-sm text-white/45">{label}</dt>
      <dd className="flex items-center gap-1.5 font-mono text-sm text-[#FAFAFA]">{children}</dd>
    </div>
  );
}

export function ReceiptView({ data }: { data: ReceiptData }) {
  const stage = data.trainingStage
    ? TRAINING_STAGE_LABELS[data.trainingStage as TrainingStage]
    : "—";
  const status = STATUS_META[data.status];
  const style = STATUS_STYLE[data.status];

  return (
    <main className="min-h-screen bg-[#0A0A0A] text-[#FAFAFA]">
      <div className="mx-auto max-w-[720px] px-4 py-12">
        {/* 1 — HEADER */}
        <header className="border-b border-white/10 pb-8">
          <div className="flex items-center gap-2">
            <GearLogo className="h-6 w-6 text-[#FAFAFA]" />
            <span className="font-semibold">Modelfuel</span>
            <span className="ml-2 font-mono text-xs uppercase tracking-[0.25em] text-white/40">
              Provenance Receipt
            </span>
          </div>
          <div
            className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold"
            style={{ color: style.color, backgroundColor: style.bg, borderColor: style.color }}
          >
            <span>{status.icon}</span>
            {status.label}
          </div>
          {data.status === "transferred" && (
            <p className="mt-2 text-xs text-white/40">
              The license token is no longer held by the original buyer (transferred or burned).
            </p>
          )}
        </header>

        {/* 2 — DATASET */}
        <section className="border-b border-white/10 py-8">
          <h1 className="text-3xl font-semibold tracking-tight">{data.title}</h1>
          <div className="mt-3 inline-block rounded bg-white/10 px-2 py-0.5 text-xs text-white/70">
            {stage}
          </div>
          {data.description && (
            <div className="mt-4">
              <ExpandableText text={data.description} />
            </div>
          )}
          <a
            href={`/listing/${data.listingId}`}
            className="mt-4 inline-block text-sm font-medium text-[#FF6B1A] hover:underline"
          >
            View on Modelfuel →
          </a>
        </section>

        {/* 3 — PARTIES */}
        <section className="grid grid-cols-1 gap-3 border-b border-white/10 py-8 sm:grid-cols-2">
          <Party role="Seller" address={data.sellerAddress} />
          <Party role="Buyer" address={data.buyerAddress} />
        </section>

        {/* 4 — TRANSACTION FACTS */}
        <section className="border-b border-white/10 py-8">
          <h2 className="mb-2 font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            Transaction facts
          </h2>
          <dl>
            <Fact label="Purchase date">
              <span title={data.purchasedAt}>
                {new Date(data.purchasedAt).toISOString().replace("T", " ").slice(0, 19)}Z
                <span className="ml-2 text-white/40">({relativeTime(data.purchasedAt)})</span>
              </span>
            </Fact>
            <Fact label="Price paid">{data.priceFormatted}</Fact>
            <Fact label="Block number">{data.blockNumber ?? "—"}</Fact>
            <Fact label="Transaction hash">
              <a
                href={txExplorerUrl(data.txHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#FF6B1A]"
              >
                {shortHex(data.txHash, 10, 8)}
              </a>
              <CopyButton value={data.txHash} label="Copy transaction hash" />
            </Fact>
            <Fact label="IP Asset ID">
              {data.ipId ? (
                <>
                  <a
                    href={ipAssetExplorerUrl(data.ipId)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[#FF6B1A]"
                  >
                    {shortHex(data.ipId, 10, 8)}
                  </a>
                  <CopyButton value={data.ipId} label="Copy IP Asset ID" />
                </>
              ) : (
                "—"
              )}
            </Fact>
            <Fact label="License token ID">{data.licenseTokenId ?? "—"}</Fact>
            <Fact label="License terms ID">{data.licenseTermsId ?? "—"}</Fact>
          </dl>
        </section>

        {/* 5 — ENFORCEMENT */}
        <section className="border-b border-white/10 py-8">
          <h2 className="mb-3 font-mono text-xs uppercase tracking-[0.25em] text-white/40">
            Enforcement
          </h2>
          <p className="rounded-lg border border-white/10 bg-white/[0.03] p-4 font-mono text-xs leading-relaxed text-white/70">
            This dataset is encrypted in a Story{" "}
            <a
              href="https://docs.story.foundation/developers/cdr-sdk/overview"
              target="_blank"
              rel="noopener noreferrer"
              className="text-[#FF6B1A] hover:underline"
            >
              Confidential Data Rails
            </a>{" "}
            vault gated by the LicenseReadCondition contract. Only wallets currently holding
            license token #{data.licenseTokenId ?? "—"} can decrypt it.
          </p>
        </section>

        {/* 6 — ACTIONS */}
        <section className="py-8">
          <ReceiptActions data={data} />
        </section>

        {/* 7 — FOOTER */}
        <footer className="border-t border-white/10 pt-8 text-xs text-white/40">
          <p className="leading-relaxed">
            Verify this receipt yourself: click the StoryScan link above to confirm the
            transaction on-chain, then call{" "}
            <span className="font-mono text-white/60">ownerOf({data.licenseTokenId ?? "—"})</span>{" "}
            on <span className="font-mono text-white/60">{data.licenseTokenAddress}</span> to
            confirm the current holder.
          </p>
          <div className="mt-6 flex items-center gap-2">
            <GearLogo className="h-4 w-4 text-white/50" />
            <span>Modelfuel</span>
            <StoryMark className="ml-1 h-3.5 w-3.5 text-white/40" />
            <span className="ml-auto">© {new Date().getFullYear()}</span>
          </div>
        </footer>
      </div>
    </main>
  );
}
