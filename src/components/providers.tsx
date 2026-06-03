"use client";

import type { ReactNode } from "react";
import { PrivyProvider } from "@privy-io/react-auth";
import { storyAeneid } from "@/lib/chains";
import { PRIVY_APP_ID, hasPrivyAppId } from "@/lib/privy";
import { TopNav, TopNavSkeleton } from "@/components/top-nav";

// Privy throws "invalid Privy app ID" if initialized without a real id, which
// would 500 every (server-rendered) page. Only mount it once a real id is set
// (`hasPrivyAppId`); until then render a static shell so the app still loads.

if (!hasPrivyAppId && typeof window !== "undefined") {
  console.warn(
    "[modelfuel] NEXT_PUBLIC_PRIVY_APP_ID is not set — sign-in is disabled until you add it to .env.local.",
  );
}

export function Providers({ children }: { children: ReactNode }) {
  if (!hasPrivyAppId) {
    return (
      <>
        <TopNavSkeleton />
        {children}
      </>
    );
  }

  return (
    <PrivyProvider
      appId={PRIVY_APP_ID}
      config={{
        // Story Aeneid is the only chain ModelFuel signs on (CDR + IP txs).
        defaultChain: storyAeneid,
        supportedChains: [storyAeneid],
        loginMethods: ["email", "google", "wallet"],
        embeddedWallets: {
          // Non-crypto users get a self-custodial wallet automatically on
          // signup; users who already linked a wallet are left as-is.
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
        appearance: {
          theme: "light",
          walletChainType: "ethereum-only",
        },
      }}
    >
      <TopNav />
      {children}
    </PrivyProvider>
  );
}
