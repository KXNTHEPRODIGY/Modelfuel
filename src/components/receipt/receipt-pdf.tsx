import { Document, Page, View, Text, StyleSheet } from "@react-pdf/renderer";
import { STATUS_META, listingUrl, type ReceiptData } from "@/lib/receipt";
import { TRAINING_STAGE_LABELS, type TrainingStage } from "@/lib/onchain/addresses";

const AMBER = "#FF6B1A";
const s = StyleSheet.create({
  page: { padding: 48, fontSize: 10, color: "#111", fontFamily: "Helvetica" },
  brand: { fontSize: 16, fontWeight: 700 },
  eyebrow: { fontSize: 9, color: "#666", letterSpacing: 2, marginTop: 2 },
  status: { marginTop: 16, fontSize: 13, fontWeight: 700 },
  h1: { fontSize: 20, fontWeight: 700, marginTop: 24 },
  chip: { marginTop: 6, fontSize: 9, color: "#444" },
  section: { marginTop: 22 },
  sectionTitle: { fontSize: 9, color: "#888", letterSpacing: 2, marginBottom: 8, textTransform: "uppercase" },
  row: { flexDirection: "row", marginBottom: 4 },
  key: { width: 130, color: "#666" },
  val: { flex: 1, fontFamily: "Courier" },
  enforce: { marginTop: 22, padding: 12, backgroundColor: "#f5f5f5", fontSize: 9, fontFamily: "Courier", color: "#333" },
  footer: { marginTop: 28, fontSize: 8, color: "#999" },
});

function Fact({ k, v }: { k: string; v: string }) {
  return (
    <View style={s.row}>
      <Text style={s.key}>{k}</Text>
      <Text style={s.val}>{v}</Text>
    </View>
  );
}

export function ReceiptPdf({ data }: { data: ReceiptData }) {
  const stage = data.trainingStage
    ? TRAINING_STAGE_LABELS[data.trainingStage as TrainingStage]
    : "—";
  const statusColor = data.status === "verified" ? AMBER : data.status === "transferred" ? "#B45309" : "#B91C1C";

  return (
    <Document title={`Modelfuel Receipt — ${data.title}`}>
      <Page size="A4" style={s.page}>
        <Text style={s.brand}>Modelfuel</Text>
        <Text style={s.eyebrow}>PROVENANCE RECEIPT</Text>
        <Text style={[s.status, { color: statusColor }]}>
          {STATUS_META[data.status].icon} {STATUS_META[data.status].label}
        </Text>

        <Text style={s.h1}>{data.title}</Text>
        <Text style={s.chip}>Training stage: {stage}</Text>
        {data.description ? <Text style={{ marginTop: 8, color: "#444" }}>{data.description}</Text> : null}
        <Text style={{ marginTop: 6, color: AMBER }}>{listingUrl(data.listingId)}</Text>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Parties</Text>
          <Fact k="Seller" v={data.sellerAddress} />
          <Fact k="Buyer" v={data.buyerAddress} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Transaction facts</Text>
          <Fact k="Purchase date" v={data.purchasedAt} />
          <Fact k="Price paid" v={data.priceFormatted} />
          <Fact k="Block number" v={data.blockNumber ?? "—"} />
          <Fact k="Transaction hash" v={data.txHash} />
          <Fact k="IP Asset ID" v={data.ipId ?? "—"} />
          <Fact k="License token ID" v={data.licenseTokenId ?? "—"} />
          <Fact k="License terms ID" v={data.licenseTermsId ?? "—"} />
          <Fact k="License token addr" v={data.licenseTokenAddress} />
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Enforcement</Text>
          <Text style={s.enforce}>
            This dataset is encrypted in a Story Confidential Data Rails vault gated by the
            LicenseReadCondition contract. Only wallets currently holding license token #
            {data.licenseTokenId ?? "—"} can decrypt it.
          </Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Verification</Text>
          <Fact k="Status" v={data.status} />
          <Fact k="Current holder" v={data.currentLicenseHolder ?? "—"} />
          <Fact k="Checked at" v={data.checkedAt} />
        </View>

        <Text style={s.footer}>
          Verify yourself: confirm the transaction on Story Aeneid (StoryScan), then call
          ownerOf({data.licenseTokenId ?? "—"}) on {data.licenseTokenAddress} to confirm the
          current holder. Issued by modelfuel.xyz · {new Date().getFullYear()}
        </Text>
      </Page>
    </Document>
  );
}
