-- Create bookmakers table
create table if not exists public.bookmakers (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  logo_url text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create odds table
create table if not exists public.odds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  bookmaker_id uuid not null references public.bookmakers(id) on delete cascade,
  market_type text not null default '1x2' check (market_type in ('1x2', 'over_under', 'handicap')),
  home_odds decimal(6,2),
  draw_odds decimal(6,2),
  away_odds decimal(6,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

create index idx_odds_match on public.odds(match_id);
create index idx_odds_bookmaker on public.odds(bookmaker_id);
create index idx_odds_updated on public.odds(updated_at desc);

-- Odds are read-only for users, no RLS needed
