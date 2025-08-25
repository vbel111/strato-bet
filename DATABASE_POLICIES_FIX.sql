-- Add missing INSERT policies for user profiles and bankrolls
-- Run this if you already have the database set up but are getting permission errors

CREATE POLICY "Users can insert own profile" ON public.user_profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can insert own bankroll" ON public.user_bankrolls
  FOR INSERT WITH CHECK (auth.uid() = user_id);
