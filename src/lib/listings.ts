import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { Listing } from "@/lib/supabase/types";

/** Active, non-expired listings for the public marketplace. */
export async function fetchActiveListings(): Promise<Listing[]> {
  const sb = getSupabaseBrowserClient();
  const nowIso = new Date().toISOString();
  const { data, error } = await sb
    .from("listings")
    .select("*")
    .eq("status", "active")
    .or(`expires_at.is.null,expires_at.gte.${nowIso}`)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

/** Single listing by id (any status — owners need to see delisted/expired). */
export async function fetchListingById(id: string): Promise<Listing | null> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("listings")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ?? null;
}

/** All listings for a seller (case-insensitive address match), any status. */
export async function fetchListingsBySeller(seller: string): Promise<Listing[]> {
  const sb = getSupabaseBrowserClient();
  const { data, error } = await sb
    .from("listings")
    .select("*")
    .ilike("seller_address", seller)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data ?? [];
}

export function isExpired(expiresAt: string | null): boolean {
  return !!expiresAt && new Date(expiresAt).getTime() < Date.now();
}

/** Human countdown to an expiry timestamp. */
export function formatCountdown(expiresAt: string | null): string {
  if (!expiresAt) return "No expiry";
  const ms = new Date(expiresAt).getTime() - Date.now();
  if (ms <= 0) return "Expired";
  const d = Math.floor(ms / 86_400_000);
  const h = Math.floor((ms % 86_400_000) / 3_600_000);
  const m = Math.floor((ms % 3_600_000) / 60_000);
  const s = Math.floor((ms % 60_000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

/** Resolve an IPFS CID through a public gateway. */
export function ipfsGatewayUrl(cid: string): string {
  const base =
    process.env.NEXT_PUBLIC_IPFS_GATEWAY ?? "https://ipfs.io/ipfs/";
  return `${base}${cid}`;
}
