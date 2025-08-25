## 🔧 **Database Cleanup & Setup Script**

If you're getting the UUID/integer type mismatch error, it means there might be existing tables with incorrect data types. Here's how to fix it:

### **Step 1: Clean Existing Tables (if needed)**

Run this cleanup script first in your Supabase SQL Editor:

```sql
-- Clean up existing tables if they have type mismatches
-- This will drop all tables and start fresh

DROP TABLE IF EXISTS public.user_bets CASCADE;
DROP TABLE IF EXISTS public.value_bets CASCADE;
DROP TABLE IF EXISTS public.odds CASCADE;
DROP TABLE IF EXISTS public.predictions CASCADE;
DROP TABLE IF EXISTS public.matches CASCADE;
DROP TABLE IF EXISTS public.teams CASCADE;
DROP TABLE IF EXISTS public.leagues CASCADE;
DROP TABLE IF EXISTS public.sports CASCADE;
DROP TABLE IF EXISTS public.bookmakers CASCADE;
DROP TABLE IF EXISTS public.user_bankrolls CASCADE;
DROP TABLE IF EXISTS public.user_profiles CASCADE;

-- Drop functions if they exist
DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;
```

### **Step 2: Run the Corrected Database Setup**

After cleanup, run this corrected script:

```sql
-- StratoBet Database Setup Script - Fixed Version
-- Creates all necessary tables with consistent UUID types

-- Create user profiles table (extends auth.users)
CREATE TABLE public.user_profiles (
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

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Create user_bankrolls table
CREATE TABLE public.user_bankrolls (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  initial_balance DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  current_balance DECIMAL(10,2) NOT NULL DEFAULT 1000.00,
  total_wagered DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_winnings DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  total_losses DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  roi_percentage DECIMAL(5,2) NOT NULL DEFAULT 0.00,
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

CREATE POLICY "Users can insert own bankroll" ON public.user_bankrolls
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create sports table
CREATE TABLE public.sports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  is_esport BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create leagues table
CREATE TABLE public.leagues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sport_id UUID REFERENCES public.sports(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  country TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(sport_id, slug)
);

-- Create teams table
CREATE TABLE public.teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  league_id UUID REFERENCES public.leagues(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(league_id, slug)
);

-- Create matches table
CREATE TABLE public.matches (
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
CREATE TABLE public.predictions (
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
CREATE TABLE public.bookmakers (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create odds table
CREATE TABLE public.odds (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  bookmaker_id UUID REFERENCES public.bookmakers(id) ON DELETE CASCADE NOT NULL,
  market_type TEXT NOT NULL DEFAULT '1x2' CHECK (market_type IN ('1x2', 'over_under', 'handicap')),
  home_odds DECIMAL(6,2),
  draw_odds DECIMAL(6,2),
  away_odds DECIMAL(6,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create value_bets table
CREATE TABLE public.value_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  prediction_id UUID REFERENCES public.predictions(id) ON DELETE CASCADE NOT NULL,
  odds_id UUID REFERENCES public.odds(id) ON DELETE CASCADE NOT NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('home', 'draw', 'away')),
  predicted_probability DECIMAL(5,4) NOT NULL,
  bookmaker_odds DECIMAL(6,2) NOT NULL,
  implied_probability DECIMAL(5,4) NOT NULL,
  value_percentage DECIMAL(5,2) NOT NULL,
  kelly_percentage DECIMAL(5,2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(prediction_id, odds_id, bet_type)
);

-- Create user_bets table
CREATE TABLE public.user_bets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  match_id UUID REFERENCES public.matches(id) ON DELETE CASCADE NOT NULL,
  value_bet_id UUID REFERENCES public.value_bets(id) ON DELETE SET NULL,
  bet_type TEXT NOT NULL CHECK (bet_type IN ('home', 'draw', 'away')),
  stake_amount DECIMAL(8,2) NOT NULL CHECK (stake_amount > 0),
  odds DECIMAL(6,2) NOT NULL CHECK (odds > 0),
  potential_payout DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'won', 'lost', 'void')),
  actual_payout DECIMAL(10,2) DEFAULT 0.00,
  is_simulation BOOLEAN NOT NULL DEFAULT true,
  placed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  settled_at TIMESTAMP WITH TIME ZONE
);

-- Enable RLS on user_bets
ALTER TABLE public.user_bets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_bets
CREATE POLICY "Users can view own bets" ON public.user_bets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bets" ON public.user_bets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_matches_date ON public.matches(match_date);
CREATE INDEX idx_matches_league ON public.matches(league_id);
CREATE INDEX idx_matches_status ON public.matches(status);
CREATE INDEX idx_odds_match ON public.odds(match_id);
CREATE INDEX idx_odds_bookmaker ON public.odds(bookmaker_id);
CREATE INDEX idx_value_bets_match ON public.value_bets(match_id);
CREATE INDEX idx_value_bets_value ON public.value_bets(value_percentage DESC);
CREATE INDEX idx_value_bets_created ON public.value_bets(created_at DESC);
CREATE INDEX idx_user_bets_user ON public.user_bets(user_id);
CREATE INDEX idx_user_bets_placed ON public.user_bets(placed_at DESC);

-- Insert initial sports data
INSERT INTO public.sports (name, slug, is_esport) VALUES
  ('Football', 'football', false),
  ('Basketball', 'basketball', false),
  ('American Football', 'american-football', false),
  ('League of Legends', 'league-of-legends', true),
  ('Counter-Strike', 'counter-strike', true),
  ('Dota 2', 'dota-2', true),
  ('Valorant', 'valorant', true)
ON CONFLICT (slug) DO NOTHING;

-- Insert initial bookmakers
INSERT INTO public.bookmakers (name, slug, logo_url) VALUES
  ('Bet365', 'bet365', null),
  ('William Hill', 'william-hill', null),
  ('Betfair', 'betfair', null),
  ('Pinnacle', 'pinnacle', null),
  ('DraftKings', 'draftkings', null)
ON CONFLICT (slug) DO NOTHING;

-- Create functions for automatic profile and bankroll creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name)
  VALUES (NEW.id, NEW.email, COALESCE(NEW.raw_user_meta_data->>'full_name', ''));
  
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

CREATE TRIGGER update_odds_updated_at
  BEFORE UPDATE ON public.odds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
```

### **Step 3: Verify Success**

After running both scripts, you should see all tables created successfully. Check your Supabase Table Editor to confirm:

✅ All tables use **UUID** primary keys
✅ All foreign key references are **UUID** to **UUID**
✅ No type mismatches
✅ Row Level Security enabled
✅ Initial data inserted

### **🎯 Key Changes Made:**

1. **Removed `IF NOT EXISTS`** - This was causing conflicts with existing tables
2. **Consistent UUID types** - All IDs are now UUID consistently
3. **Proper foreign key constraints** - All references are UUID to UUID
4. **Added missing RLS policy** - INSERT policy for user_profiles
5. **Simplified trigger creation** - Removed conditional drops that were causing issues

This should resolve the `foreign key constraint cannot be implemented` error!
