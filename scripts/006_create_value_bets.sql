-- Create value bets table (calculated from predictions vs odds)
create table if not exists public.value_bets (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  prediction_id uuid not null references public.predictions(id) on delete cascade,
  odds_id uuid not null references public.odds(id) on delete cascade,
  bet_type text not null check (bet_type in ('home', 'draw', 'away')),
  predicted_probability decimal(5,4) not null,
  bookmaker_odds decimal(6,2) not null,
  implied_probability decimal(5,4) not null,
  value_percentage decimal(5,2) not null,
  kelly_percentage decimal(5,2),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(prediction_id, odds_id, bet_type)
);

create index idx_value_bets_match on public.value_bets(match_id);
create index idx_value_bets_value on public.value_bets(value_percentage desc);
create index idx_value_bets_created on public.value_bets(created_at desc);

-- Value bets are read-only for users, no RLS needed
