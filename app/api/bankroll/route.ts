import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get or create user bankroll
    let { data: bankroll } = await supabase
      .from('user_bankrolls')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!bankroll) {
      const { data: newBankroll } = await supabase
        .from('user_bankrolls')
        .insert({ user_id: user.id })
        .select()
        .single()
      bankroll = newBankroll
    }

    return NextResponse.json({ bankroll })
  } catch (error) {
    console.error("Error fetching bankroll:", error)
    return NextResponse.json({ error: "Failed to fetch bankroll" }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { initialBalance } = await request.json()

    if (!initialBalance || initialBalance <= 0) {
      return NextResponse.json({ error: "Invalid initial balance" }, { status: 400 })
    }

    // Update or create bankroll with initial balance
    const { data: bankroll, error } = await supabase
      .from('user_bankrolls')
      .upsert({ 
        user_id: user.id, 
        balance: initialBalance,
        simulation_balance: 10000 // Default simulation balance
      })
      .select()
      .single()

    if (error) {
      console.error("Error initializing bankroll:", error)
      return NextResponse.json({ error: "Failed to initialize bankroll" }, { status: 500 })
    }

    return NextResponse.json({ bankroll })
  } catch (error) {
    console.error("Error initializing bankroll:", error)
    return NextResponse.json({ error: "Failed to initialize bankroll" }, { status: 500 })
  }
}
