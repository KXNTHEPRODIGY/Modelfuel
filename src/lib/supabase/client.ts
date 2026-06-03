import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

let browserClient: SupabaseClient<Database> | undefined;

/**
 * Anon Supabase client for the browser. Subject to RLS, so it can browse public
 * `listings` but cannot read/write anything a policy doesn't allow. Returns a
 * lazily-created singleton to avoid spinning up multiple GoTrue instances.
 *
 * For seller-scoped writes, the server should mint a Supabase JWT carrying a
 * `wallet_address` claim (after verifying the Privy token) and pass it via
 * `global.headers.Authorization` so the RLS policies in 0001_init.sql apply.
 */
export function getSupabaseBrowserClient(): SupabaseClient<Database> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Supabase browser env missing — set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local",
    );
  }

  browserClient ??= createClient<Database>(url, anonKey);
  return browserClient;
}
