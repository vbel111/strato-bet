# 🗄️ Database Setup Instructions

## Quick Setup (Copy & Paste into Supabase SQL Editor)

### Step 1: Go to Supabase Dashboard
1. Open your Supabase project: https://swfxsjbdmxomeazyqymz.supabase.co
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Copy and Paste This Complete Script

Copy everything below and paste into the SQL Editor, then click "Run":

```sql
-- StratoBet Database Setup Script
-- Run this script to create all necessary tables and policies

-- Create user profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on user_profiles
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
CREATE POLICY "Users can view own profile" ON public.user_profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.user_profiles
  FOR UPDATE USING (auth.uid() = id);

-- Create user_bankrolls table
CREATE TABLE IF NOT EXISTS public.user_bankrolls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  balance DECIMAL(10,2) DEFAULT 1000.00 NOT NULL CHECK (balance >= 0),
  simulation_balance DECIMAL(10,2) DEFAULT 10000.00 NOT NULL CHECK (simulation_balance >= 0),
  total_deposited DECIMAL(10,2) DEFAULT 1000.00 NOT NULL CHECK (total_deposited >= 0),
  total_withdrawn DECIMAL(10,2) DEFAULT 0.00 NOT NULL CHECK (total_withdrawn >= 0),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Enable RLS on user_bankrolls
ALTER TABLE public.user_bankrolls ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_bankrolls
CREATE POLICY "Users can view own bankroll" ON public.user_bankrolls
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own bankroll" ON public.user_bankrolls
  FOR UPDATE USING (auth.uid() = user_id);

-- Create user_bets table
CREATE TABLE IF NOT EXISTS public.user_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('home_win', 'away_win', 'draw', 'over', 'under')),
  amount DECIMAL(10,2) NOT NULL CHECK (amount > 0),
  odds DECIMAL(5,2) NOT NULL CHECK (odds > 0),
  potential_payout DECIMAL(10,2) NOT NULL CHECK (potential_payout > 0),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  is_simulation BOOLEAN DEFAULT true,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE,
  actual_payout DECIMAL(10,2) DEFAULT 0.00
);

-- Enable RLS on user_bets
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_bets
CREATE POLICY "Users can view own bets" ON public.user_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" ON public.user_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create sports table
CREATE TABLE IF NOT EXISTS public.sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_esport BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leagues table
CREATE TABLE IF NOT EXISTS public.leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_id UUID REFERENCES public.sports(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sport_id, slug)
);

-- Create teams table
CREATE TABLE IF NOT EXISTS public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, slug)
);

-- Create matches table
CREATE TABLE IF NOT EXISTS public.matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  home_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  away_team_id UUID REFERENCES public.teams(id) ON DELETE CASCADE NOT NULL,
  match_date TIMESTAMP WITH TIME ZONE NOT NULL,
  status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'finished', 'cancelled')),
  home_score INTEGER DEFAULT 0,
  away_score INTEGER DEFAULT 0,
  external_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create predictions table
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  home_win_probability DECIMAL(5,4) NOT NULL CHECK (home_win_probability BETWEEN 0 AND 1),
  away_win_probability DECIMAL(5,4) NOT NULL CHECK (away_win_probability BETWEEN 0 AND 1),
  draw_probability DECIMAL(5,4) NOT NULL CHECK (draw_probability BETWEEN 0 AND 1),
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score BETWEEN 0 AND 1),
  model_version TEXT DEFAULT 'v1.0',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id)
);

-- Create bookmakers table
CREATE TABLE IF NOT EXISTS public.bookmakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  website_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create bookmaker_odds table
CREATE TABLE IF NOT EXISTS public.bookmaker_odds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  bookmaker_id UUID REFERENCES public.bookmakers(id) ON DELETE CASCADE NOT NULL,
  market_type TEXT NOT NULL CHECK (market_type IN ('match_winner', 'over_under', 'handicap')),
  home_odds DECIMAL(5,2),
  away_odds DECIMAL(5,2),
  draw_odds DECIMAL(5,2),
  over_odds DECIMAL(5,2),
  under_odds DECIMAL(5,2),
  line DECIMAL(3,1),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create value_bets table
CREATE TABLE IF NOT EXISTS public.value_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
  bookmaker_id UUID REFERENCES public.bookmakers(id) ON DELETE CASCADE NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('home_win', 'away_win', 'draw')),
  predicted_probability DECIMAL(5,4) NOT NULL,
  bookmaker_odds DECIMAL(5,2) NOT NULL,
  implied_probability DECIMAL(5,4) NOT NULL,
  value_percentage DECIMAL(5,2) NOT NULL,
  kelly_percentage DECIMAL(5,2) NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(match_id, bookmaker_id, bet_type)
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_matches_date ON public.matches(match_date);
CREATE INDEX IF NOT EXISTS idx_matches_league ON public.matches(league_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_user_id ON public.user_bets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_bets_placed_at ON public.user_bets(placed_at);
CREATE INDEX IF NOT EXISTS idx_value_bets_match ON public.value_bets(match_id);
CREATE INDEX IF NOT EXISTS idx_bookmaker_odds_match ON public.bookmaker_odds(match_id);

-- Insert initial data
INSERT INTO public.sports (name, slug, is_esport) VALUES
  ('Football', 'football', false),
  ('Basketball', 'basketball', false),
  ('American Football', 'american-football', false),
  ('League of Legends', 'league-of-legends', true),
  ('Counter-Strike', 'counter-strike', true),
  ('Dota 2', 'dota-2', true),
  ('Valorant', 'valorant', true)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO public.bookmakers (name, slug, website_url) VALUES
  ('Bet365', 'bet365', 'https://www.bet365.com'),
  ('William Hill', 'william-hill', 'https://www.williamhill.com'),
  ('Betfair', 'betfair', 'https://www.betfair.com'),
  ('Pinnacle', 'pinnacle', 'https://www.pinnacle.com'),
  ('DraftKings', 'draftkings', 'https://www.draftkings.com')
ON CONFLICT (slug) DO NOTHING;

-- Create functions for automatic profile and bankroll creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, NEW.raw_user_meta_data->>'full_name');
  
  INSERT INTO public.user_bankrolls (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for new user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_user_bankrolls_updated_at
  BEFORE UPDATE ON public.user_bankrolls
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_matches_updated_at
  BEFORE UPDATE ON public.matches
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookmaker_odds_updated_at
  BEFORE UPDATE ON public.bookmaker_odds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### Step 3: After Running the Script

1. **Verify Tables Created**: Check the "Table Editor" in Supabase to see all your tables
2. **Update Vercel Environment**: Make sure your new Supabase credentials are also set in Vercel
3. **Test the App**: Try signing up - it should now work!

### What This Script Does:
- ✅ Creates all necessary tables (users, bets, matches, odds, etc.)
- ✅ Sets up Row Level Security (RLS) for data protection
- ✅ Creates automatic triggers for new user profiles and bankrolls
- ✅ Adds initial sports and bookmaker data
- ✅ Creates performance indexes
- ✅ Sets up proper relationships between tables

### Next Steps:
1. Run this script in Supabase SQL Editor
2. Update your Vercel environment variables with the new credentials
3. Test signup/login functionality
4. Your app should be fully functional!
