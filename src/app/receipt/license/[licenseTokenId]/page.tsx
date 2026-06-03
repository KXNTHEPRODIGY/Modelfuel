import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getReceiptByLicenseId } from "@/lib/server/receipt";
import { ReceiptView } from "@/components/receipt/receipt-view";
import { receiptUrl, siteUrl } from "@/lib/receipt";
import { shortAddress } from "@/lib/utils";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Alias: resolve a receipt by license token id (looks up the purchase row),
 * then render the same view. Canonical URL remains /receipt/<txHash>.
 */
export async function generateMetadata({
  params,
}: {
  params: { licenseTokenId: string };
}): Promise<Metadata> {
  const data = await getReceiptByLicenseId(params.licenseTokenId);
  if (!data) return { title: "Receipt not found | Modelfuel" };
  const title = `Receipt — ${data.title} | Modelfuel`;
  const description = `Verified on-chain purchase of ${data.title} by ${shortAddress(
    data.buyerAddress,
  )} on Story Aeneid. License #${data.licenseTokenId ?? "—"}.`;
  const og = `${siteUrl()}/api/og/receipt/${data.txHash}`;
  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: receiptUrl(data.txHash),
      images: [{ url: og, width: 1200, height: 630 }],
    },
    twitter: { card: "summary_large_image", title, description, images: [og] },
  };
}

export default async function ReceiptByLicensePage({
  params,
}: {
  params: { licenseTokenId: string };
}) {
  const data = await getReceiptByLicenseId(params.licenseTokenId);
  if (!data) notFound();
  return <ReceiptView data={data} />;
}
