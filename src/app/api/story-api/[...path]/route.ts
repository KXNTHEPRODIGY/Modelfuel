import { NextResponse } from "next/server";

export const runtime = "nodejs";

const STORY_API = process.env.STORY_API_URL ?? "http://172.192.41.96:1317";

/**
 * Same-origin HTTPS proxy for the Story-API REST reads (DKG pubkey, registry,
 * cdr_partials, …). The browser CDR client can't call the upstream directly
 * because it's plain HTTP and the site is HTTPS (mixed content). These are
 * public, read-only DKG endpoints, so we just forward GETs server-side.
 */
export async function GET(
  req: Request,
  { params }: { params: { path: string[] } },
): Promise<Response> {
  const search = new URL(req.url).search; // preserves ?query
  const upstream = `${STORY_API.replace(/\/+$/, "")}/${(params.path ?? []).join("/")}${search}`;

  try {
    const res = await fetch(upstream, {
      headers: { Accept: "application/json" },
      cache: "no-store",
    });
    const body = await res.text();
    return new NextResponse(body, {
      status: res.status,
      headers: {
        "content-type": res.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (e) {
    return NextResponse.json(
      { error: `Story-API proxy failed: ${e instanceof Error ? e.message : "unknown"}` },
      { status: 502 },
    );
  }
}
