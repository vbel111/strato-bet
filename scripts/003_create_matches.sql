-- Create matches table
create table if not exists public.matches (
  id uuid primary key default gen_random_uuid(),
  league_id uuid not null references public.leagues(id) on delete cascade,
  home_team_id uuid not null references public.teams(id) on delete cascade,
  away_team_id uuid not null references public.teams(id) on delete cascade,
  match_date timestamp with time zone not null,
  status text not null default 'scheduled' check (status in ('scheduled', 'live', 'finished', 'cancelled')),
  home_score integer,
  away_score integer,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Add indexes for performance
create index idx_matches_date on public.matches(match_date);
create index idx_matches_league on public.matches(league_id);
create index idx_matches_status on public.matches(status);

-- Matches are read-only for users, no RLS needed
