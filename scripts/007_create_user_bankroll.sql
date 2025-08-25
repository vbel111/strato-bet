-- Create user bankroll management
create table if not exists public.user_bankrolls (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  initial_balance decimal(10,2) not null default 1000.00,
  current_balance decimal(10,2) not null default 1000.00,
  total_wagered decimal(10,2) not null default 0.00,
  total_winnings decimal(10,2) not null default 0.00,
  total_losses decimal(10,2) not null default 0.00,
  roi_percentage decimal(5,2) not null default 0.00,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id)
);

-- Enable RLS
alter table public.user_bankrolls enable row level security;

-- RLS policies for user bankrolls
create policy "bankrolls_select_own"
  on public.user_bankrolls for select
  using (auth.uid() = user_id);

create policy "bankrolls_insert_own"
  on public.user_bankrolls for insert
  with check (auth.uid() = user_id);

create policy "bankrolls_update_own"
  on public.user_bankrolls for update
  using (auth.uid() = user_id);

-- Auto-create bankroll on profile creation
create or replace function public.handle_new_bankroll()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.user_bankrolls (user_id)
  values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_profile_created on public.profiles;

create trigger on_profile_created
  after insert on public.profiles
  for each row
  execute function public.handle_new_bankroll();
