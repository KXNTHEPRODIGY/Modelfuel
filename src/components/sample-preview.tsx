"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";

const MAX_ROWS = 200;

type Parsed =
  | { kind: "json"; text: string }
  | { kind: "csv"; rows: string[][] }
  | { kind: "text"; lines: string[] };

function parsePreview(raw: string): Parsed {
  try {
    const json = JSON.parse(raw);
    const rows = Array.isArray(json) ? json.slice(0, MAX_ROWS) : json;
    return { kind: "json", text: JSON.stringify(rows, null, 2) };
  } catch {
    // not JSON
  }
  const lines = raw.split(/\r?\n/).filter((l) => l.length > 0);
  if (lines.length > 0 && lines[0].includes(",")) {
    return { kind: "csv", rows: lines.slice(0, MAX_ROWS).map((l) => l.split(",")) };
  }
  return { kind: "text", lines: lines.slice(0, MAX_ROWS) };
}

export function SamplePreview({ cid }: { cid: string }) {
  const [state, setState] = useState<"idle" | "loading" | "error" | "ready">("idle");
  const [error, setError] = useState<string | null>(null);
  const [parsed, setParsed] = useState<Parsed | null>(null);

  async function load() {
    setState("loading");
    setError(null);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20_000);
      // `cid` is a Supabase storage path; get a short-lived signed URL for it.
      const signRes = await fetch("/api/storage/signed-url", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ path: cid }),
        signal: controller.signal,
      });
      if (!signRes.ok) throw new Error("Could not resolve the sample URL.");
      const { signedUrl } = (await signRes.json()) as { signedUrl: string };
      const res = await fetch(signedUrl, { signal: controller.signal });
      clearTimeout(timeout);
      if (!res.ok) throw new Error(`Sample fetch returned ${res.status}`);
      const raw = await res.text();
      setParsed(parsePreview(raw));
      setState("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load sample");
      setState("error");
    }
  }

  return (
    <div className="space-y-3">
      <Button variant="outline" onClick={load} disabled={state === "loading"}>
        {state === "loading" ? "Loading sample…" : "Preview sample"}
      </Button>

      {error && <p className="text-sm text-red-500">{error}</p>}

      {parsed && (
        <div className="max-h-96 overflow-auto rounded-lg border bg-muted/30 p-3 text-xs">
          {parsed.kind === "csv" ? (
            <table className="w-full border-collapse font-mono">
              <tbody>
                {parsed.rows.map((cells, r) => (
                  <tr key={r} className="border-b last:border-0">
                    {cells.map((c, i) => (
                      <td key={i} className="whitespace-nowrap px-2 py-0.5">
                        {c}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <pre className="whitespace-pre-wrap font-mono">
              {parsed.kind === "json" ? parsed.text : parsed.lines.join("\n")}
            </pre>
          )}
        </div>
      )}
      {parsed && (
        <p className="text-xs text-muted-foreground">Showing up to {MAX_ROWS} rows.</p>
      )}
    </div>
  );
}
