# 🚨 SUPABASE PROJECT ISSUE IDENTIFIED

## Problem:
The Supabase URL `xkbzygdfuoqpgskohknl.supabase.co` returns `ERR_NAME_NOT_RESOLVED`
This means the project doesn't exist or was temporary/demo project from v0.

## Solution:
1. Create a real Supabase project at supabase.com
2. Get the real URL and anon key
3. Update environment variables
4. Run database setup scripts

## Steps:
1. Go to https://supabase.com
2. Sign up/login
3. Create new project named "stratobet"
4. Copy Project URL and anon key from Settings → API
5. Update .env.local and Vercel environment variables
6. Run the database setup script from DATABASE_SETUP.md

## Temporary Workaround:
The app can run with mock data while you set up the real database.
Just comment out the Supabase env vars to trigger fallback mode.
