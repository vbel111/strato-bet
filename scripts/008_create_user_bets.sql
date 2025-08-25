-- Create user bets table
create table if not exists public.user_bets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  match_id uuid not null references public.matches(id) on delete cascade,
  value_bet_id uuid references public.value_bets(id) on delete set null,
  bet_type text not null check (bet_type in ('home', 'draw', 'away')),
  stake_amount decimal(8,2) not null check (stake_amount > 0),
  odds decimal(6,2) not null check (odds > 0),
  potential_payout decimal(10,2) not null,
  status text not null default 'pending' check (status in ('pending', 'won', 'lost', 'void')),
  actual_payout decimal(10,2) default 0.00,
  is_simulation boolean not null default true,
  placed_at timestamp with time zone default timezone('utc'::text, now()) not null,
  settled_at timestamp with time zone
);

-- Enable RLS
alter table public.user_bets enable row level security;

-- RLS policies for user bets
create policy "bets_select_own"
  on public.user_bets for select
  using (auth.uid() = user_id);

create policy "bets_insert_own"
  on public.user_bets for insert
  with check (auth.uid() = user_id);

create policy "bets_update_own"
  on public.user_bets for update
  using (auth.uid() = user_id);

create index idx_user_bets_user on public.user_bets(user_id);
create index idx_user_bets_match on public.user_bets(match_id);
create index idx_user_bets_status on public.user_bets(status);
create index idx_user_bets_placed on public.user_bets(placed_at desc);

-- Function to calculate potential payout
create or replace function calculate_potential_payout()
returns trigger
language plpgsql
as $$
begin
  new.potential_payout = new.stake_amount * new.odds;
  return new;
end;
$$;

create trigger calculate_payout_trigger
  before insert or update on public.user_bets
  for each row
  execute function calculate_potential_payout();
