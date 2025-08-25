import { z } from "zod"

const envSchema = z.object({
  // Supabase (Required)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Invalid Supabase URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase anon key is required"),
  
  // External APIs (Optional)
  ODDS_API_KEY: z.string().optional(),
  PANDASCORE_API_KEY: z.string().optional(),
  OPENAI_API_KEY: z.string().optional(),
  
  // Development
  NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: z.string().url().optional(),
})

export type Environment = z.infer<typeof envSchema>

export function validateEnvironment(): Environment {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      ODDS_API_KEY: process.env.ODDS_API_KEY,
      PANDASCORE_API_KEY: process.env.PANDASCORE_API_KEY,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL,
    })
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errorMessages = error.errors.map(err => `${err.path.join('.')}: ${err.message}`).join('\n')
      throw new Error(`Environment validation failed:\n${errorMessages}`)
    }
    throw error
  }
}

// Validate environment variables on import (server-side only)
if (typeof window === 'undefined') {
  try {
    validateEnvironment()
  } catch (error) {
    console.error('Environment validation failed:', error)
    // Don't throw in development if only optional variables are missing
    if (process.env.NODE_ENV === 'production') {
      throw error
    }
  }
}
