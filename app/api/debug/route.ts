import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    
    // Test 1: Check authentication
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json({ 
        success: false,
        error: "Authentication failed",
        details: authError?.message || "No user found"
      })
    }

    // Test 2: Check if user_profiles table exists and is accessible
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Test 3: Check if user_bankrolls table exists and is accessible
    const { data: bankroll, error: bankrollError } = await supabase
      .from('user_bankrolls')
      .select('*')
      .eq('user_id', user.id)
      .single()

    // Test 4: Check if user_bets table exists and is accessible
    const { data: bets, error: betsError } = await supabase
      .from('user_bets')
      .select('*')
      .eq('user_id', user.id)
      .limit(5)

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email
      },
      tests: {
        profile: {
          data: profile,
          error: profileError?.message
        },
        bankroll: {
          data: bankroll,
          error: bankrollError?.message
        },
        bets: {
          data: bets,
          error: betsError?.message
        }
      }
    })

  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Unexpected error",
      details: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    })
  }
}
