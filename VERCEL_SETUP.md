# Vercel Deployment Fix Guide

## Issues Fixed:
1. ✅ Changed app title from "V0" to "StratoBet"
2. ✅ Added better error handling for missing environment variables
3. ✅ Prevented JWT tokens from showing in user error messages
4. ✅ Added environment variables validation

## Required Environment Variables on Vercel

**Go to your Vercel project → Settings → Environment Variables and add:**

### Supabase (Required)
```
NEXT_PUBLIC_SUPABASE_URL=https://xkbzygdfuoqpgskohknl.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhrYnp5Z2RmdW9xcGdza29oa25sIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzU2ODg0MTMsImV4cCI6MjA1MTI2NDQxM30.7cH1Hy7n8IVbCGrX2nHnbkTMt0b0QvKF1WZqfEfDmF4
```

### Optional (for full features)
```
THE_ODDS_API_KEY=e176e168d1df1f616d3008d2e5a2ccf7
PANDASCORE_API_KEY=PN5aBYtS5cTWX_QFA420LW1X7IHzfWcGZ5jqbk6K8FE1qIYwH0c
```

## Steps to Fix Current Issues:

1. **Set Environment Variables**: Add the variables above to Vercel
2. **Redeploy**: Push new code or trigger a redeploy
3. **Test Environment**: Visit `/env-check` on your deployed site to verify variables are loaded
4. **Test Signup**: Try creating an account again

## Debug Tools Added:
- Visit `your-domain.vercel.app/env-check` to see if environment variables are loaded correctly
- Better error messages that don't expose sensitive tokens
- Improved error handling in authentication

## If Still Getting Errors:
1. Check Vercel function logs in your dashboard
2. Ensure all environment variables are set for "Production" environment
3. Make sure there are no extra spaces in the variable values
4. Try redeploying after setting variables
