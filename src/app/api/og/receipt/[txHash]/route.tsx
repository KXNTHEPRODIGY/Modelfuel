import { ImageResponse } from "next/og";
import { getReceiptByTxHash } from "@/lib/server/receipt";
import { STATUS_META } from "@/lib/receipt";
import { shortAddress, shortHex } from "@/lib/utils";

export const runtime = "nodejs";

const SIZE = { width: 1200, height: 630 };

export async function GET(
  _req: Request,
  { params }: { params: { txHash: string } },
): Promise<Response> {
  let data = null;
  try {
    data = await getReceiptByTxHash(params.txHash);
  } catch {
    /* render the fallback card */
  }

  const accent = "#FF6B1A";
  const statusColor =
    data?.status === "verified"
      ? accent
      : data?.status === "transferred"
        ? "#EAB308"
        : "#EF4444";
  const title = data?.title ?? "Receipt not found";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0A0A0A",
          color: "#FAFAFA",
          padding: 64,
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div
            style={{
              display: "flex",
              width: 48,
              height: 48,
              borderRadius: 10,
              background: accent,
              color: "#0A0A0A",
              alignItems: "center",
              justifyContent: "center",
              fontSize: 32,
              fontWeight: 800,
            }}
          >
            M
          </div>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 700 }}>Modelfuel</div>
          <div
            style={{
              display: "flex",
              marginLeft: 14,
              fontSize: 18,
              color: "#888",
              letterSpacing: 4,
            }}
          >
            PROVENANCE RECEIPT
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
          <div style={{ display: "flex", fontSize: 58, fontWeight: 700, lineHeight: 1.05 }}>
            {title.length > 56 ? `${title.slice(0, 56)}…` : title}
          </div>
          {data && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                fontSize: 28,
                color: statusColor,
              }}
            >
              <span>{STATUS_META[data.status].icon}</span>
              <span>{STATUS_META[data.status].label}</span>
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 8,
            fontSize: 22,
            color: "#9a9a9a",
          }}
        >
          {data && (
            <div style={{ display: "flex" }}>
              seller {shortAddress(data.sellerAddress)} → buyer {shortAddress(data.buyerAddress)}
            </div>
          )}
          {data && <div style={{ display: "flex" }}>tx {shortHex(data.txHash, 12, 10)}</div>}
        </div>
      </div>
    ),
    SIZE,
  );
}
