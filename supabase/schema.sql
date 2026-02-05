-- MADDAD MVP schema (profiles + requests + donations)
-- Apply in Supabase SQL Editor.

create extension if not exists pgcrypto;

-- Storage buckets (best-effort, idempotent). If your SQL Editor role can't write
-- to storage tables, this block will be skipped without stopping the rest.
do $$
begin
  -- request-images: Private (served via signed URLs)
  insert into storage.buckets (id, name, public)
  values ('request-images', 'request-images', false)
  on conflict (id) do update set name = excluded.name, public = excluded.public;

  -- campaign-images: Public (public URLs for campaign cards)
  insert into storage.buckets (id, name, public)
  values ('campaign-images', 'campaign-images', true)
  on conflict (id) do update set name = excluded.name, public = excluded.public;
exception
  when undefined_table then null;
  when insufficient_privilege then null;
  when others then null;
end $$;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  role text not null default 'donor' check (role in ('admin', 'donor', 'beneficiary')),
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

-- Admin helper (used by RLS policies)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth.uid() = '205db945-dc5a-4740-94cf-4a01244e9dee'::uuid
    or exists (
      select 1
      from public.profiles p
      where p.id = auth.uid()
        and p.role = 'admin'
    );
$$;

-- Create a profile row for every new auth user
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', new.email))
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- Force admin role for the specified admin user id
insert into public.profiles (id, name, role)
values (
  '205db945-dc5a-4740-94cf-4a01244e9dee',
  'Mohamed Matany',
  'admin'
)
on conflict (id) do update set role = excluded.role;

create table if not exists public.requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null references public.profiles (id),
  requester_name text not null,
  phone text not null,
  location text not null,
  request_type text not null check (request_type in ('money','food','clothes','medical','education','housing')),
  description text not null,
  urgency_level text not null default 'medium' check (urgency_level in ('low','medium','high','urgent')),
  images jsonb not null default '[]'::jsonb,
  is_anonymous boolean not null default false,
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.donation_campaigns (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text,
  currency text not null default 'EGP',
  min_amount integer not null default 10,
  max_amount integer not null default 100,
  starts_on date,
  ends_on date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (min_amount > 0),
  check (max_amount >= min_amount)
);

-- Backfill/migrate for existing projects (create table if not exists doesn't add columns)
alter table public.donation_campaigns
  add column if not exists image_url text;

alter table public.donation_campaigns
  add column if not exists goal_amount integer not null default 10000;

-- Backfill/migrate new profile + activity columns
alter table public.profiles
  add column if not exists is_anonymous boolean not null default false;

alter table public.requests
  add column if not exists user_id uuid references public.profiles (id);

alter table public.requests
  add column if not exists is_anonymous boolean not null default false;

alter table public.donations
  add column if not exists user_id uuid references public.profiles (id);

alter table public.donations
  add column if not exists is_anonymous boolean not null default false;

do $$
begin
  alter table public.donation_campaigns
    add constraint donation_campaigns_goal_amount_nonnegative check (goal_amount >= 0);
exception
  when duplicate_object then null;
  when others then null;
end $$;

-- campaign images bucket (create in Supabase Storage as PUBLIC):
-- name: campaign-images

create table if not exists public.donations (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.donation_campaigns (id),
  amount integer not null check (amount > 0),
  currency text not null default 'EGP',
  user_id uuid null references public.profiles (id),
  donor_name text,
  phone text,
  is_anonymous boolean not null default false,
  created_at timestamptz not null default now()
);

-- Backfill/migrate for existing projects (create table if not exists doesn't add columns)
alter table public.donations
  add column if not exists payment_code text;

alter table public.donations
  add column if not exists payment_method text;

alter table public.donations
  add column if not exists status text not null default 'pending';

alter table public.donations
  add column if not exists updated_at timestamptz not null default now();

-- Constraints + indexes (idempotent)
do $$
begin
  alter table public.donations
    add constraint donations_status_valid
    check (status in ('pending','verified','canceled','proof_sent'));
exception
  when duplicate_object then null;
  when others then null;
end $$;

do $$
begin
  alter table public.donations
    add constraint donations_payment_method_valid
    check (
      payment_method is null
      or payment_method in ('vodafone_cash','bank_transfer','whatsapp','fawry','instapay','other')
    );
exception
  when duplicate_object then null;
  when others then null;
end $$;

create unique index if not exists donations_payment_code_key
  on public.donations(payment_code);

-- RLS (fix Supabase linter: rls_disabled_in_public)
alter table public.profiles enable row level security;
alter table public.requests enable row level security;
alter table public.donation_campaigns enable row level security;
alter table public.donations enable row level security;

-- Grants (PostgREST roles)
grant select on public.donation_campaigns to anon, authenticated;
grant select on public.profiles to authenticated;

-- Policies (idempotent via drop)
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists profiles_admin_all on public.profiles;
create policy profiles_admin_all
on public.profiles
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists requests_admin_all on public.requests;
create policy requests_admin_all
on public.requests
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists campaigns_select_active on public.donation_campaigns;
create policy campaigns_select_active
on public.donation_campaigns
for select
to anon, authenticated
using (is_active = true);

drop policy if exists campaigns_admin_all on public.donation_campaigns;
create policy campaigns_admin_all
on public.donation_campaigns
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

drop policy if exists donations_admin_all on public.donations;
create policy donations_admin_all
on public.donations
for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_requests_updated_at on public.requests;
create trigger trg_requests_updated_at
before update on public.requests
for each row execute function public.set_updated_at();

drop trigger if exists trg_campaigns_updated_at on public.donation_campaigns;
create trigger trg_campaigns_updated_at
before update on public.donation_campaigns
for each row execute function public.set_updated_at();

drop trigger if exists trg_donations_updated_at on public.donations;
create trigger trg_donations_updated_at
before update on public.donations
for each row execute function public.set_updated_at();

-- Seed: first real donation campaign (10-100 EGP) "إطعام المساكين" من 2/10 حتى رمضان
insert into public.donation_campaigns (slug, title, description, min_amount, max_amount, currency, starts_on, ends_on, is_active)
values (
  'feed-poor-ramadan',
  'إطعام المساكين',
  'تبرع من 10 إلى 100 جنيه لإطعام المساكين من 2/10 حتى رمضان.',
  10,
  100,
  'EGP',
  '2025-10-02',
  null,
  true
)
on conflict (slug) do nothing;

-- Seed: general donations campaign (supports 500/1000 EGP amounts)
insert into public.donation_campaigns (slug, title, description, image_url, min_amount, max_amount, goal_amount, currency, is_active)
values (
  'general',
  'تبرع عام',
  'تبرعات عامة لدعم أعمال الخير والمحتاجين.',
  '/images/donate-hero.jpg',
  10,
  5000,
  50000,
  'EGP',
  true
)
on conflict (slug) do nothing;
