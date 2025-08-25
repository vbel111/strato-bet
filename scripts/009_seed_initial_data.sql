-- Seed initial sports data
insert into public.sports (name, slug) values
  ('Football', 'football'),
  ('Basketball', 'basketball'),
  ('Tennis', 'tennis'),
  ('Baseball', 'baseball')
on conflict (slug) do nothing;

-- Seed major football leagues
insert into public.leagues (sport_id, name, slug, country)
select 
  s.id,
  league_data.name,
  league_data.slug,
  league_data.country
from public.sports s
cross join (
  values 
    ('Premier League', 'premier-league', 'England'),
    ('La Liga', 'la-liga', 'Spain'),
    ('Bundesliga', 'bundesliga', 'Germany'),
    ('Serie A', 'serie-a', 'Italy'),
    ('Ligue 1', 'ligue-1', 'France'),
    ('Champions League', 'champions-league', 'Europe'),
    ('NFL', 'nfl', 'USA'),
    ('NBA', 'nba', 'USA')
) as league_data(name, slug, country)
where s.slug = 'football' and league_data.country != 'USA'
   or s.slug = 'basketball' and league_data.slug = 'nba'
   or s.slug = 'football' and league_data.slug = 'nfl'
on conflict (sport_id, slug) do nothing;

-- Seed major bookmakers
insert into public.bookmakers (name, slug) values
  ('Bet365', 'bet365'),
  ('William Hill', 'william-hill'),
  ('Betfair', 'betfair'),
  ('Pinnacle', 'pinnacle'),
  ('DraftKings', 'draftkings'),
  ('FanDuel', 'fanduel')
on conflict (slug) do nothing;
