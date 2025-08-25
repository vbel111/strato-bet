import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables. Please check your Vercel environment settings.")
  }

  // Add some debug logging in development
  if (process.env.NODE_ENV === 'development') {
    console.log('Supabase URL:', supabaseUrl)
    console.log('Supabase Key exists:', !!supabaseAnonKey)
  }

  try {
    return createBrowserClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    })
  } catch (error) {
    console.error('Error creating Supabase client:', error)
    throw error
  }
}
