import { hasPrivyAppId } from "@/lib/privy";
import { AuthPanel } from "@/components/auth-panel";

export default function Home() {
  return (
    <main className="mx-auto max-w-6xl px-4 py-16 sm:py-24">
      <div className="max-w-2xl">
        <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
          License-gated AI models &amp; datasets
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          ModelFuel encrypts models and datasets with Story Confidential Data
          Rails and unlocks them with on-chain license tokens — pay to decrypt,
          royalties to creators.
        </p>

        <div className="mt-10">
          {hasPrivyAppId ? (
            <AuthPanel />
          ) : (
            <div className="w-full max-w-md rounded-lg border border-dashed p-6 text-sm text-muted-foreground">
              Set a real{" "}
              <code className="font-mono text-foreground">
                NEXT_PUBLIC_PRIVY_APP_ID
              </code>{" "}
              in <code className="font-mono text-foreground">.env.local</code>{" "}
              and restart the dev server to enable sign-in.
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
