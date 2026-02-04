-- ALZAKA MVP schema (profiles + requests)
-- Apply in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text,
  phone text,
  role text not null default 'donor' check (role in ('admin', 'donor', 'beneficiary')),
  created_at timestamptz not null default now()
);

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
  status text not null default 'pending' check (status in ('pending','approved','rejected','completed')),
  admin_notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

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

