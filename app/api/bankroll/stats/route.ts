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

    // Get user bets for stats
    const { data: bets } = await supabase
      .from('user_bets')
      .select('*')
      .eq('user_id', user.id)
      .eq('is_simulation', false)

    const settledBets = bets?.filter(bet => bet.status === 'won' || bet.status === 'lost') || []
    const winningBets = settledBets.filter(bet => bet.status === 'won')
    
    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.amount, 0)
    const totalReturns = winningBets.reduce((sum, bet) => sum + bet.actual_payout, 0)
    const profitLoss = totalReturns - totalStaked
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0

    const stats = {
      total_bets: settledBets.length,
      winning_bets: winningBets.length,
      losing_bets: settledBets.length - winningBets.length,
      win_rate: settledBets.length > 0 ? (winningBets.length / settledBets.length) * 100 : 0,
      profit_loss: profitLoss,
      roi: roi,
      balance: bankroll?.balance || 1000,
      simulation_balance: bankroll?.simulation_balance || 10000
    }

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching bankroll stats:", error)
    return NextResponse.json({ error: "Failed to fetch bankroll stats" }, { status: 500 })
  }
}
