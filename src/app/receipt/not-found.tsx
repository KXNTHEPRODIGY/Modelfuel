export default function ReceiptNotFound() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#0A0A0A] px-4 text-center text-[#FAFAFA]">
      <div className="max-w-md">
        <p className="font-mono text-xs uppercase tracking-[0.25em] text-white/40">
          Provenance Receipt
        </p>
        <h1 className="mt-3 text-2xl font-semibold">Receipt not found</h1>
        <p className="mt-3 text-white/55">
          The transaction hash may be incorrect or not from Modelfuel.
        </p>
        <a
          href="/market"
          className="mt-6 inline-block rounded-lg px-5 py-2.5 text-sm font-semibold text-[#0A0A0A]"
          style={{ backgroundColor: "#FF6B1A" }}
        >
          Go to the market
        </a>
      </div>
    </main>
  );
}
