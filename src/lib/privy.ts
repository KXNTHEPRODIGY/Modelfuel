const PLACEHOLDER_APP_ID = "your-privy-app-id";

/** The configured Privy app id (empty string if unset). */
export const PRIVY_APP_ID = process.env.NEXT_PUBLIC_PRIVY_APP_ID ?? "";

/**
 * True only when a real Privy app id is configured. `PrivyProvider` throws an
 * "invalid Privy app ID" error during SSR/prerender if mounted without one, so
 * both the provider and any Privy-consuming UI gate on this flag.
 */
export const hasPrivyAppId =
  PRIVY_APP_ID.length > 0 && PRIVY_APP_ID !== PLACEHOLDER_APP_ID;
