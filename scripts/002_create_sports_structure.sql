-- Create sports and leagues
create table if not exists public.sports (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create table if not exists public.leagues (
  id uuid primary key default gen_random_uuid(),
  sport_id uuid not null references public.sports(id) on delete cascade,
  name text not null,
  slug text not null,
  country text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(sport_id, slug)
);

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  name text not null,
  slug text not null,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(league_id, slug)
);

-- These tables are read-only for users, no RLS needed
-- Only admin operations will modify sports structure
