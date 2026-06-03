import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Service-role Supabase client for trusted server code (Route Handlers, Server
 * Actions). Uses the secret service-role key, so it **bypasses RLS** — only use
 * it after independently authorizing the caller (e.g. verifying the Privy access
 * token). Never import this into a Client Component; `server-only` enforces that
 * at build time so the service-role key can never reach the browser bundle.
 */
export function createSupabaseServerClient(): SupabaseClient<Database> {
  const url = process.env.SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Supabase server env missing — set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in .env.local",
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
