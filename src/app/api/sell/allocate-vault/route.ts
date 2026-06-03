import { NextResponse } from "next/server";
import { encodeAbiParameters } from "viem";
import { z } from "zod";
import { createServerCdrClient, ensureCdrWasm } from "@/lib/server/cdr";
import {
  LICENSE_READ_CONDITION,
  LICENSE_TOKEN,
  OWNER_WRITE_CONDITION,
} from "@/lib/onchain/addresses";

export const runtime = "nodejs";

const schema = z.object({ ipId: z.string().regex(/^0x[0-9a-fA-F]{40}$/) });

/**
 * Allocates a CDR vault: read gated by LicenseReadCondition(LICENSE_TOKEN, ipId)
 * so any holder of a license token for this IP can decrypt; write gated by
 * OwnerWriteCondition bound to the platform dev wallet (the signer here).
 */
export async function POST(req: Request): Promise<Response> {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid or missing ipId" }, { status: 400 });
  }

  await ensureCdrWasm();
  const { client, account } = createServerCdrClient();

  const writeConditionData = encodeAbiParameters(
    [{ type: "address" }],
    [account.address],
  );
  const readConditionData = encodeAbiParameters(
    [{ type: "address" }, { type: "address" }],
    [LICENSE_TOKEN, parsed.data.ipId as `0x${string}`],
  );

  const { uuid, txHash } = await client.uploader.allocate({
    updatable: false,
    writeConditionAddr: OWNER_WRITE_CONDITION,
    writeConditionData,
    readConditionAddr: LICENSE_READ_CONDITION,
    readConditionData,
  });

  return NextResponse.json({ vaultUuid: uuid, txHash });
}
