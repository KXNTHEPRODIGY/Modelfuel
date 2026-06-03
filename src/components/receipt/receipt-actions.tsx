"use client";

import { useState } from "react";
import { buildReceiptJson, receiptUrl, type ReceiptData } from "@/lib/receipt";
import { txExplorerUrl } from "@/lib/onchain/addresses";

function shortTx(h: string) {
  return h ? h.slice(2, 10) : "receipt";
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

const BTN =
  "inline-flex h-10 items-center justify-center rounded-lg border border-white/15 px-4 text-sm font-medium text-[#FAFAFA] transition-colors hover:bg-white/5 disabled:opacity-50";

export function ReceiptActions({ data }: { data: ReceiptData }) {
  const [toast, setToast] = useState<string | null>(null);
  const [pdfBusy, setPdfBusy] = useState(false);

  function flash(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 2200);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(receiptUrl(data.txHash));
      flash("Receipt link copied");
    } catch {
      flash("Copy failed");
    }
  }

  function downloadJson() {
    const blob = new Blob([JSON.stringify(buildReceiptJson(data), null, 2)], {
      type: "application/json",
    });
    triggerDownload(blob, `modelfuel-receipt-${shortTx(data.txHash)}.json`);
  }

  async function downloadPdf() {
    setPdfBusy(true);
    try {
      const [{ pdf }, { ReceiptPdf }] = await Promise.all([
        import("@react-pdf/renderer"),
        import("@/components/receipt/receipt-pdf"),
      ]);
      const blob = await pdf(<ReceiptPdf data={data} />).toBlob();
      triggerDownload(blob, `modelfuel-receipt-${shortTx(data.txHash)}.pdf`);
    } catch {
      flash("PDF export failed");
    } finally {
      setPdfBusy(false);
    }
  }

  return (
    <>
      <div className="z-40 flex flex-wrap items-center gap-2 border-t border-white/10 bg-[#0A0A0A]/95 px-4 py-3 backdrop-blur max-sm:fixed max-sm:inset-x-0 max-sm:bottom-0 sm:rounded-xl sm:border sm:px-4">
        <button
          type="button"
          onClick={copyLink}
          className="inline-flex h-10 items-center justify-center rounded-lg px-4 text-sm font-semibold text-[#0A0A0A]"
          style={{ backgroundColor: "#FF6B1A" }}
        >
          Copy link
        </button>
        <button type="button" onClick={downloadJson} className={BTN}>
          Download JSON
        </button>
        <button type="button" onClick={downloadPdf} disabled={pdfBusy} className={BTN}>
          {pdfBusy ? "Generating PDF…" : "Download PDF"}
        </button>
        <a
          href={txExplorerUrl(data.txHash)}
          target="_blank"
          rel="noopener noreferrer"
          className={BTN}
        >
          View on StoryScan ↗
        </a>
      </div>

      {/* mobile spacer so the fixed bar doesn't cover the footer */}
      <div className="h-16 sm:hidden" aria-hidden />

      {toast && (
        <div className="fixed bottom-20 left-1/2 z-50 -translate-x-1/2 rounded-lg border border-white/15 bg-[#161616] px-4 py-2 text-sm text-[#FAFAFA] shadow-lg sm:bottom-6">
          {toast}
        </div>
      )}
    </>
  );
}
