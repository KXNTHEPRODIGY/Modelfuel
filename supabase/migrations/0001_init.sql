-- ModelFuel initial schema: listings, purchases, encrypted storage bucket, RLS.
--
-- Run this in the Supabase SQL editor, or via the CLI:
--   supabase db push        (if using migrations)
--   psql "$DATABASE_URL" -f supabase/migrations/0001_init.sql
--
-- Auth model: ModelFuel authenticates users with Privy, NOT Supabase Auth, so
-- RLS cannot use auth.uid(). Instead, seller-scoped policies check a
-- `wallet_address` claim on the request JWT (auth.jwt() ->> 'wallet_address').
-- The server mints that JWT (signed with the project's JWT secret) for a
-- seller-scoped client after verifying the Privy access token. The service_role
-- key BYPASSES RLS, so trusted server routes can still write freely.

create extension if not exists "pgcrypto"; -- gen_random_uuid()

-- ── listings ─────────────────────────────────────────────────────────────────
create table if not exists public.listings (
  id                    uuid primary key default gen_random_uuid(),
  seller_address        text not null,
  title                 text not null,
  description           text,
  price_ip              numeric,
  training_stage        text check (
                          training_stage in (
                            'pretraining', 'sft', 'rlhf', 'dpo', 'eval', 'other'
                          )
                        ),
  main_vault_id         text,
  ip_id                 text,
  license_terms_id      text,
  license_token_address text,
  sample_cid            text,            -- nullable: optional preview vault
  expires_at            timestamptz,
  status                text not null default 'active',
  created_at            timestamptz not null default now()
);

create index if not exists listings_seller_address_idx on public.listings (seller_address);
create index if not exists listings_status_idx on public.listings (status);

-- ── purchases ────────────────────────────────────────────────────────────────
create table if not exists public.purchases (
  id               uuid primary key default gen_random_uuid(),
  listing_id       uuid not null references public.listings (id) on delete cascade,
  buyer_address    text not null,
  license_token_id text,
  tx_hash          text,
  created_at       timestamptz not null default now()
);

create index if not exists purchases_listing_id_idx on public.purchases (listing_id);
create index if not exists purchases_buyer_address_idx on public.purchases (buyer_address);

-- ── Row Level Security ───────────────────────────────────────────────────────
alter table public.listings enable row level security;
alter table public.purchases enable row level security;

-- PostgREST reads run as the `anon` / `authenticated` roles; grant SELECT so RLS
-- (below) governs visibility. Writes are reserved for service_role + JWT-scoped
-- sellers via the policies below. service_role bypasses RLS entirely.
grant select on public.listings to anon, authenticated;
grant select, update, insert on public.listings to authenticated;
grant select on public.purchases to authenticated;

-- listings: anyone may browse.
create policy "listings_select_public"
  on public.listings
  for select
  using (true);

-- listings: only the seller can update their own row. Enforced by matching the
-- row's seller_address against the request JWT's wallet_address claim
-- (case-insensitive, since EVM addresses are checksummed). Anonymous requests
-- have no such claim, so the predicate is false and updates are denied.
create policy "listings_update_own"
  on public.listings
  for update
  using (lower(seller_address) = lower(auth.jwt() ->> 'wallet_address'))
  with check (lower(seller_address) = lower(auth.jwt() ->> 'wallet_address'));

-- listings: a seller-scoped client may insert listings for its own address.
-- (Server routes using the service_role key can insert regardless.)
create policy "listings_insert_own"
  on public.listings
  for insert
  with check (lower(seller_address) = lower(auth.jwt() ->> 'wallet_address'));

-- purchases: a buyer can read only their own purchases. Inserts are recorded
-- server-side (service_role) after the on-chain license mint succeeds, so there
-- is intentionally no insert/update policy for anon/authenticated.
create policy "purchases_select_own"
  on public.purchases
  for select
  using (lower(buyer_address) = lower(auth.jwt() ->> 'wallet_address'));

-- ── Storage: private encrypted bucket ────────────────────────────────────────
-- Holds AES-ciphertext bodies for CDR sample/preview uploads. Private: only the
-- service_role server client reads/writes it; no anon/authenticated policies are
-- added, so storage.objects RLS denies all public access by default.
insert into storage.buckets (id, name, public)
values ('modelfuel-encrypted', 'modelfuel-encrypted', false)
on conflict (id) do nothing;
