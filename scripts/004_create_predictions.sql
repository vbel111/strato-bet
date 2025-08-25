-- Create ML predictions table
create table if not exists public.predictions (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches(id) on delete cascade,
  model_version text not null,
  home_win_probability decimal(5,4) not null check (home_win_probability >= 0 and home_win_probability <= 1),
  draw_probability decimal(5,4) check (draw_probability >= 0 and draw_probability <= 1),
  away_win_probability decimal(5,4) not null check (away_win_probability >= 0 and away_win_probability <= 1),
  confidence_score decimal(3,2) not null check (confidence_score >= 0 and confidence_score <= 1),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(match_id, model_version)
);

-- Add constraint to ensure probabilities sum to 1 (allowing for rounding)
alter table public.predictions add constraint check_probability_sum 
  check (abs((home_win_probability + coalesce(draw_probability, 0) + away_win_probability) - 1.0) < 0.01);

create index idx_predictions_match on public.predictions(match_id);
create index idx_predictions_confidence on public.predictions(confidence_score desc);

-- Predictions are read-only for users, no RLS needed
