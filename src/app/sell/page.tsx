"use client";

import { useRef, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { usePrivy } from "@privy-io/react-auth";

import { useStoryWalletClient } from "@/hooks/use-story-wallet-client";
import { sellFormSchema, type SellFormValues } from "@/lib/sell/schema";
import {
  type SellContext,
  stepAllocateVault,
  stepAttachLicense,
  stepCreateListing,
  stepEncryptAndStore,
  stepRegisterIp,
  stepUploadSample,
} from "@/lib/sell/steps";
import {
  LICENSE_TOKEN,
  TRAINING_STAGES,
  TRAINING_STAGE_LABELS,
  txExplorerUrl,
} from "@/lib/onchain/addresses";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";

type StepKey = "ip" | "license" | "vault" | "encrypt" | "sample" | "listing";
type StepStatus = "pending" | "running" | "done" | "skipped" | "error";

type TxLink = { label: string; hash: string };
type StepState = { status: StepStatus; txs?: TxLink[]; note?: string; error?: string };

const STEP_ORDER: { key: StepKey; label: string }[] = [
  { key: "ip", label: "Register Story IP Asset" },
  { key: "license", label: "Attach commercial-remix license (PIL)" },
  { key: "vault", label: "Allocate CDR vault" },
  { key: "encrypt", label: "Encrypt main dataset → Supabase + vault" },
  { key: "sample", label: "Upload sample to IPFS" },
  { key: "listing", label: "Create listing" },
];

const initialSteps = (): Record<StepKey, StepState> =>
  Object.fromEntries(
    STEP_ORDER.map(({ key }) => [key, { status: "pending" as StepStatus }]),
  ) as Record<StepKey, StepState>;

function errorMessage(e: unknown): string {
  if (e instanceof Error) return e.message;
  return typeof e === "string" ? e : "Unknown error";
}

async function fileToBytes(file: File): Promise<Uint8Array> {
  return new Uint8Array(await file.arrayBuffer());
}

const DOT: Record<StepStatus, string> = {
  pending: "bg-muted-foreground/30",
  running: "bg-amber-500 animate-pulse",
  done: "bg-emerald-500",
  skipped: "bg-muted-foreground/40",
  error: "bg-red-500",
};

export default function SellPage() {
  const { ready, authenticated, login } = usePrivy();
  const { address, getWalletClient } = useStoryWalletClient();

  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<SellFormValues>({
    resolver: zodResolver(sellFormSchema),
    defaultValues: { training_stage: undefined, duration_days: 30 },
  });

  const [mainFile, setMainFile] = useState<File | null>(null);
  const [sampleFile, setSampleFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const [drawerOpen, setDrawerOpen] = useState(false);
  const [steps, setSteps] = useState<Record<StepKey, StepState>>(initialSteps());
  const [running, setRunning] = useState(false);
  const [resumeIndex, setResumeIndex] = useState<number | null>(null);
  const [doneAll, setDoneAll] = useState(false);

  // Persisted across runs so "resume" can pick up where it failed.
  const ctxRef = useRef<SellContext>({});
  const valuesRef = useRef<SellFormValues | null>(null);
  const filesRef = useRef<{ main?: Uint8Array; sample?: Uint8Array }>({});

  const setStep = (key: StepKey, patch: Partial<StepState>) =>
    setSteps((prev) => ({ ...prev, [key]: { ...prev[key], ...patch } }));

  async function run(fromIndex: number) {
    const values = valuesRef.current;
    if (!values || !address) return;

    setRunning(true);
    setResumeIndex(null);

    let wallet;
    try {
      wallet = await getWalletClient();
      if (!wallet) throw new Error("Wallet not ready — reconnect and try again.");
    } catch (e) {
      setRunning(false);
      setResumeIndex(fromIndex);
      setStep(STEP_ORDER[fromIndex].key, { status: "error", error: errorMessage(e) });
      return;
    }

    const ctx = ctxRef.current;
    const seller = address;

    for (let i = fromIndex; i < STEP_ORDER.length; i++) {
      const { key } = STEP_ORDER[i];
      setStep(key, { status: "running", error: undefined });
      try {
        if (key === "ip") {
          const r = await stepRegisterIp(wallet, seller);
          ctx.ipId = r.ipId;
          setStep(key, {
            status: "done",
            note: `ipId ${r.ipId.slice(0, 10)}…`,
            txs: [{ label: "mint+register", hash: r.txHash }],
          });
        } else if (key === "license") {
          const r = await stepAttachLicense(wallet, ctx.ipId!, values.price_ip);
          ctx.licenseTermsId = r.licenseTermsId;
          setStep(key, {
            status: "done",
            note: `licenseTermsId ${r.licenseTermsId}`,
            txs: [
              { label: "register PIL", hash: r.registerTxHash },
              ...(r.attachTxHash ? [{ label: "attach", hash: r.attachTxHash }] : []),
            ],
          });
        } else if (key === "vault") {
          const r = await stepAllocateVault(ctx.ipId!);
          ctx.vaultUuid = r.vaultUuid;
          setStep(key, {
            status: "done",
            note: `vault uuid ${r.vaultUuid}`,
            txs: [{ label: "allocate", hash: r.txHash }],
          });
        } else if (key === "encrypt") {
          const r = await stepEncryptAndStore(ctx.vaultUuid!, filesRef.current.main!);
          ctx.storagePath = r.storagePath;
          setStep(key, {
            status: "done",
            note: r.storagePath,
            txs: [{ label: "vault write", hash: r.txHash }],
          });
        } else if (key === "sample") {
          if (!filesRef.current.sample) {
            setStep(key, { status: "skipped", note: "no sample provided" });
            continue;
          }
          const r = await stepUploadSample(filesRef.current.sample);
          ctx.sampleCid = r.sampleCid;
          setStep(key, { status: "done", note: `CID ${r.sampleCid}` });
        } else if (key === "listing") {
          const r = await stepCreateListing({
            seller_address: seller,
            title: values.title,
            description: values.description ? values.description : null,
            price_ip: values.price_ip,
            training_stage: values.training_stage,
            main_vault_id: String(ctx.vaultUuid),
            ip_id: ctx.ipId!,
            license_terms_id: ctx.licenseTermsId!,
            license_token_address: LICENSE_TOKEN,
            sample_cid: ctx.sampleCid ?? null,
            expires_at: new Date(
              Date.now() + values.duration_days * 86_400_000,
            ).toISOString(),
          });
          ctx.listingId = r.listingId;
          setStep(key, { status: "done", note: `listing ${r.listingId}` });
        }
      } catch (e) {
        setStep(key, { status: "error", error: errorMessage(e) });
        setResumeIndex(i);
        setRunning(false);
        return;
      }
    }

    setRunning(false);
    setDoneAll(true);
  }

  const onSubmit = handleSubmit(async (values) => {
    setFileError(null);
    if (!mainFile) {
      setFileError("A main dataset file is required.");
      return;
    }
    if (!authenticated) {
      login();
      return;
    }

    valuesRef.current = values;
    filesRef.current = {
      main: await fileToBytes(mainFile),
      sample: sampleFile ? await fileToBytes(sampleFile) : undefined,
    };
    ctxRef.current = {};
    setSteps(initialSteps());
    setDoneAll(false);
    setDrawerOpen(true);
    void run(0);
  });

  if (ready && !authenticated) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">List a dataset</h1>
        <p className="mt-3 text-muted-foreground">Sign in to create a listing.</p>
        <Button className="mt-6" onClick={() => login()}>
          Sign in
        </Button>
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">List a dataset</h1>
      <p className="mt-2 text-muted-foreground">
        Register it as Story IP, gate it behind a license, and encrypt it with CDR.
      </p>

      <form onSubmit={onSubmit} className="mt-8 space-y-6">
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="e.g. CleanWeb SFT corpus v2" {...register("title")} />
          {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description</Label>
          <Textarea
            id="description"
            rows={4}
            placeholder="What's in the dataset, how it was built, intended use…"
            {...register("description")}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message}</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_ip">Price ($IP)</Label>
            <Input
              id="price_ip"
              type="number"
              step="any"
              min="0"
              placeholder="10"
              {...register("price_ip")}
            />
            {errors.price_ip && (
              <p className="text-sm text-red-500">{errors.price_ip.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration_days">Listing duration (days)</Label>
            <Input id="duration_days" type="number" min="1" {...register("duration_days")} />
            {errors.duration_days && (
              <p className="text-sm text-red-500">{errors.duration_days.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label>Training stage</Label>
          <Controller
            control={control}
            name="training_stage"
            render={({ field }) => (
              <Select value={field.value ?? ""} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a training stage" />
                </SelectTrigger>
                <SelectContent>
                  {TRAINING_STAGES.map((stage) => (
                    <SelectItem key={stage} value={stage}>
                      {TRAINING_STAGE_LABELS[stage]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
          {errors.training_stage && (
            <p className="text-sm text-red-500">{errors.training_stage.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="mainFile">Main dataset file (required)</Label>
          <Input
            id="mainFile"
            type="file"
            onChange={(e) => setMainFile(e.target.files?.[0] ?? null)}
          />
          {fileError && <p className="text-sm text-red-500">{fileError}</p>}
        </div>

        <div className="space-y-2">
          <Label htmlFor="sampleFile">Sample dataset file (optional, public preview)</Label>
          <Input
            id="sampleFile"
            type="file"
            onChange={(e) => setSampleFile(e.target.files?.[0] ?? null)}
          />
        </div>

        <Button type="submit" disabled={running}>
          {running ? "Publishing…" : "Publish listing"}
        </Button>
      </form>

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent>
          <div className="mx-auto flex max-h-[85vh] w-full max-w-md flex-1 flex-col overflow-hidden">
            <DrawerHeader>
              <DrawerTitle>Publishing listing</DrawerTitle>
              <DrawerDescription>
                Each step is a separate transaction. If one fails, fix the cause and resume —
                completed steps are not repeated.
              </DrawerDescription>
            </DrawerHeader>

            <ol className="min-h-0 flex-1 space-y-4 overflow-y-auto px-4 pb-2">
              {STEP_ORDER.map(({ key, label }, i) => {
                const s = steps[key];
                return (
                  <li key={key} className="flex gap-3">
                    <span className={`mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${DOT[s.status]}`} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium">
                        {i + 1}. {label}
                        {s.status === "skipped" && (
                          <span className="ml-2 text-xs text-muted-foreground">skipped</span>
                        )}
                      </p>
                      {s.note && (
                        <p className="truncate font-mono text-xs text-muted-foreground">{s.note}</p>
                      )}
                      {s.txs?.map((tx) => (
                        <a
                          key={tx.hash}
                          href={txExplorerUrl(tx.hash)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="block truncate font-mono text-xs text-blue-600 hover:underline"
                        >
                          {tx.label}: {tx.hash.slice(0, 14)}…
                        </a>
                      ))}
                      {s.error && <p className="text-xs text-red-500">{s.error}</p>}
                    </div>
                  </li>
                );
              })}
            </ol>

            <DrawerFooter>
              {doneAll ? (
                <p className="text-sm font-medium text-emerald-600">
                  Listing published — vault {ctxRef.current.vaultUuid}.
                </p>
              ) : resumeIndex !== null ? (
                <Button onClick={() => run(resumeIndex)} disabled={running}>
                  Resume from “{STEP_ORDER[resumeIndex].label}”
                </Button>
              ) : null}
              <Button variant="ghost" disabled={running} onClick={() => setDrawerOpen(false)}>
                Close
              </Button>
            </DrawerFooter>
          </div>
        </DrawerContent>
      </Drawer>
    </main>
  );
}
