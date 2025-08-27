import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const isSimulation = searchParams.get("simulation") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    let query = supabase
      .from('user_bets')
      .select(`
        *,
        matches:match_id(home_team, away_team, commence_time)
      `)
      .eq('user_id', user.id)

    if (status) {
      query = query.eq('status', status)
    }

    query = query
      .eq('is_simulation', isSimulation)
      .order('created_at', { ascending: false })
      .limit(limit)

    const { data: bets, error } = await query

    if (error) {
      console.error("Error fetching bets:", error)
      return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 })
    }

    return NextResponse.json({ bets: bets || [] })
  } catch (error) {
    console.error("Error fetching bets:", error)
    return NextResponse.json({ error: "Failed to fetch bets" }, { status: 500 })
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

    const betData = await request.json()

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

    // Check if user has sufficient balance
    const availableBalance = betData.is_simulation ? bankroll.simulation_balance : bankroll.balance
    if (availableBalance < betData.amount) {
      return NextResponse.json({ error: "Insufficient balance" }, { status: 400 })
    }

    // Place the bet
    const { data: bet, error: betError } = await supabase
      .from('user_bets')
      .insert({
        user_id: user.id,
        match_id: betData.match_id,
        bet_type: betData.bet_type,
        amount: betData.amount,
        odds: betData.odds,
        potential_payout: betData.amount * betData.odds,
        is_simulation: betData.is_simulation || false,
        status: 'pending'
      })
      .select()
      .single()

    if (betError) {
      console.error("Error placing bet:", betError)
      return NextResponse.json({ error: "Failed to place bet" }, { status: 500 })
    }

    // Update bankroll
    const newBalance = availableBalance - betData.amount
    const updateField = betData.is_simulation ? 'simulation_balance' : 'balance'
    
    await supabase
      .from('user_bankrolls')
      .update({ [updateField]: newBalance })
      .eq('user_id', user.id)

    return NextResponse.json({ bet })
  } catch (error) {
    console.error("Error placing bet:", error)
    return NextResponse.json({ error: "Failed to place bet" }, { status: 500 })
  }
}
