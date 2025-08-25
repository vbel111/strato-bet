import { createClient } from "@/lib/supabase/server"
import type { ValueBetOpportunity } from "./value-bet-calculator"

export interface BankrollData {
  id: string
  user_id: string
  initial_balance: number
  current_balance: number
  total_wagered: number
  total_winnings: number
  total_losses: number
  roi_percentage: number
  created_at: string
  updated_at: string
}

export interface BetRecord {
  id: string
  user_id: string
  match_id: string
  value_bet_id?: string
  bet_type: "home" | "draw" | "away"
  stake_amount: number
  odds: number
  potential_payout: number
  status: "pending" | "won" | "lost" | "void"
  actual_payout: number
  is_simulation: boolean
  placed_at: string
  settled_at?: string
  match_info?: {
    home_team: string
    away_team: string
    league: string
    match_date: string
  }
}

export interface BankrollStats {
  total_bets: number
  winning_bets: number
  losing_bets: number
  win_rate: number
  average_odds: number
  profit_loss: number
  roi: number
  longest_winning_streak: number
  longest_losing_streak: number
  best_bet: BetRecord | null
  worst_bet: BetRecord | null
}

export class BankrollManager {
  private static instance: BankrollManager

  private constructor() {}

  public static getInstance(): BankrollManager {
    if (!BankrollManager.instance) {
      BankrollManager.instance = new BankrollManager()
    }
    return BankrollManager.instance
  }

  async getUserBankroll(userId: string): Promise<BankrollData | null> {
    const supabase = await createClient()

    const { data: bankroll, error } = await supabase.from("user_bankrolls").select("*").eq("user_id", userId).single()

    if (error) {
      console.error("Error fetching bankroll:", error)
      return null
    }

    return bankroll
  }

  async initializeBankroll(userId: string, initialBalance = 1000): Promise<BankrollData> {
    const supabase = await createClient()

    const { data: bankroll, error } = await supabase
      .from("user_bankrolls")
      .upsert({
        user_id: userId,
        initial_balance: initialBalance,
        current_balance: initialBalance,
        total_wagered: 0,
        total_winnings: 0,
        total_losses: 0,
        roi_percentage: 0,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to initialize bankroll: ${error.message}`)
    }

    return bankroll
  }

  async placeBet(
    userId: string,
    betData: {
      matchId: string
      valueBetId?: string
      betType: "home" | "draw" | "away"
      stakeAmount: number
      odds: number
      isSimulation?: boolean
    },
  ): Promise<BetRecord> {
    const supabase = await createClient()

    // Check if user has sufficient balance
    const bankroll = await this.getUserBankroll(userId)
    if (!bankroll) {
      throw new Error("Bankroll not found")
    }

    if (!betData.isSimulation && bankroll.current_balance < betData.stakeAmount) {
      throw new Error("Insufficient balance")
    }

    // Calculate potential payout
    const potentialPayout = betData.stakeAmount * betData.odds

    // Create bet record
    const { data: bet, error } = await supabase
      .from("user_bets")
      .insert({
        user_id: userId,
        match_id: betData.matchId,
        value_bet_id: betData.valueBetId,
        bet_type: betData.betType,
        stake_amount: betData.stakeAmount,
        odds: betData.odds,
        potential_payout: potentialPayout,
        status: "pending",
        actual_payout: 0,
        is_simulation: betData.isSimulation || false,
      })
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to place bet: ${error.message}`)
    }

    // Update bankroll if not simulation
    if (!betData.isSimulation) {
      await this.updateBankrollAfterBet(userId, betData.stakeAmount)
    }

    return bet
  }

  private async updateBankrollAfterBet(userId: string, stakeAmount: number): Promise<void> {
    const supabase = await createClient()

    // Get current bankroll
    const { data: bankroll, error: fetchError } = await supabase
      .from("user_bankrolls")
      .select("current_balance, total_wagered")
      .eq("user_id", userId)
      .single()

    if (fetchError || !bankroll) {
      throw new Error(`Failed to fetch bankroll: ${fetchError?.message}`)
    }

    // Update with calculated values
    const { error } = await supabase
      .from("user_bankrolls")
      .update({
        current_balance: bankroll.current_balance - stakeAmount,
        total_wagered: bankroll.total_wagered + stakeAmount,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)

    if (error) {
      throw new Error(`Failed to update bankroll: ${error.message}`)
    }
  }

  async settleBet(betId: string, won: boolean): Promise<void> {
    const supabase = await createClient()

    // Get bet details
    const { data: bet, error: betError } = await supabase.from("user_bets").select("*").eq("id", betId).single()

    if (betError || !bet) {
      throw new Error("Bet not found")
    }

    const actualPayout = won ? bet.potential_payout : 0
    const status = won ? "won" : "lost"

    // Update bet status
    const { error: updateError } = await supabase
      .from("user_bets")
      .update({
        status,
        actual_payout: actualPayout,
        settled_at: new Date().toISOString(),
      })
      .eq("id", betId)

    if (updateError) {
      throw new Error(`Failed to settle bet: ${updateError.message}`)
    }

    // Update bankroll if not simulation
    if (!bet.is_simulation) {
      await this.updateBankrollAfterSettlement(bet.user_id, actualPayout, won)
    }
  }

  private async updateBankrollAfterSettlement(userId: string, actualPayout: number, won: boolean): Promise<void> {
    const supabase = await createClient()

    // Get current bankroll values
    const { data: bankroll, error: fetchError } = await supabase
      .from("user_bankrolls")
      .select("current_balance, total_winnings, total_losses")
      .eq("user_id", userId)
      .single()

    if (fetchError || !bankroll) {
      throw new Error(`Failed to fetch bankroll: ${fetchError?.message}`)
    }

    const updateData: any = {
      current_balance: bankroll.current_balance + actualPayout,
      updated_at: new Date().toISOString(),
    }

    if (won) {
      updateData.total_winnings = bankroll.total_winnings + actualPayout
    } else {
      updateData.total_losses = bankroll.total_losses + actualPayout
    }

    const { error } = await supabase.from("user_bankrolls").update(updateData).eq("user_id", userId)

    if (error) {
      throw new Error(`Failed to update bankroll after settlement: ${error.message}`)
    }

    // Recalculate ROI
    await this.recalculateROI(userId)
  }

  private async recalculateROI(userId: string): Promise<void> {
    const supabase = await createClient()

    const { data: bankroll } = await supabase.from("user_bankrolls").select("*").eq("user_id", userId).single()

    if (!bankroll) return

    const roi =
      bankroll.total_wagered > 0
        ? ((bankroll.current_balance - bankroll.initial_balance) / bankroll.initial_balance) * 100
        : 0

    await supabase.from("user_bankrolls").update({ roi_percentage: roi }).eq("user_id", userId)
  }

  async getUserBets(
    userId: string,
    filters?: {
      status?: string
      isSimulation?: boolean
      limit?: number
    },
  ): Promise<BetRecord[]> {
    const supabase = await createClient()

    let query = supabase
      .from("user_bets")
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name),
          league:leagues(name)
        )
      `)
      .eq("user_id", userId)
      .order("placed_at", { ascending: false })

    if (filters?.status) {
      query = query.eq("status", filters.status)
    }

    if (filters?.isSimulation !== undefined) {
      query = query.eq("is_simulation", filters.isSimulation)
    }

    if (filters?.limit) {
      query = query.limit(filters.limit)
    }

    const { data: bets, error } = await query

    if (error) {
      throw new Error(`Failed to fetch bets: ${error.message}`)
    }

    return bets.map((bet) => ({
      ...bet,
      match_info: bet.match
        ? {
            home_team: bet.match.home_team.name,
            away_team: bet.match.away_team.name,
            league: bet.match.league.name,
            match_date: bet.match.match_date,
          }
        : undefined,
    }))
  }

  async getBankrollStats(userId: string): Promise<BankrollStats> {
    const bets = await this.getUserBets(userId, { isSimulation: false })

    const settledBets = bets.filter((bet) => bet.status === "won" || bet.status === "lost")
    const winningBets = bets.filter((bet) => bet.status === "won")
    const losingBets = bets.filter((bet) => bet.status === "lost")

    const totalOdds = settledBets.reduce((sum, bet) => sum + bet.odds, 0)
    const averageOdds = settledBets.length > 0 ? totalOdds / settledBets.length : 0

    const totalStaked = settledBets.reduce((sum, bet) => sum + bet.stake_amount, 0)
    const totalReturns = winningBets.reduce((sum, bet) => sum + bet.actual_payout, 0)
    const profitLoss = totalReturns - totalStaked
    const roi = totalStaked > 0 ? (profitLoss / totalStaked) * 100 : 0

    // Calculate streaks
    const { longestWinning, longestLosing } = this.calculateStreaks(settledBets)

    // Find best and worst bets
    const bestBet = winningBets.reduce(
      (best, bet) => {
        const profit = bet.actual_payout - bet.stake_amount
        const bestProfit = best ? best.actual_payout - best.stake_amount : 0
        return profit > bestProfit ? bet : best
      },
      null as BetRecord | null,
    )

    const worstBet = losingBets.reduce(
      (worst, bet) => {
        return !worst || bet.stake_amount > worst.stake_amount ? bet : worst
      },
      null as BetRecord | null,
    )

    return {
      total_bets: settledBets.length,
      winning_bets: winningBets.length,
      losing_bets: losingBets.length,
      win_rate: settledBets.length > 0 ? (winningBets.length / settledBets.length) * 100 : 0,
      average_odds: averageOdds,
      profit_loss: profitLoss,
      roi,
      longest_winning_streak: longestWinning,
      longest_losing_streak: longestLosing,
      best_bet: bestBet,
      worst_bet: worstBet,
    }
  }

  private calculateStreaks(bets: BetRecord[]): { longestWinning: number; longestLosing: number } {
    let longestWinning = 0
    let longestLosing = 0
    let currentWinning = 0
    let currentLosing = 0

    // Sort by placed_at to get chronological order
    const sortedBets = [...bets].sort((a, b) => new Date(a.placed_at).getTime() - new Date(b.placed_at).getTime())

    for (const bet of sortedBets) {
      if (bet.status === "won") {
        currentWinning++
        currentLosing = 0
        longestWinning = Math.max(longestWinning, currentWinning)
      } else if (bet.status === "lost") {
        currentLosing++
        currentWinning = 0
        longestLosing = Math.max(longestLosing, currentLosing)
      }
    }

    return { longestWinning, longestLosing }
  }

  async simulateBet(userId: string, valueBet: ValueBetOpportunity): Promise<BetRecord> {
    // Calculate recommended stake using Kelly Criterion (capped at 5% of bankroll)
    const bankroll = await this.getUserBankroll(userId)
    if (!bankroll) {
      throw new Error("Bankroll not found")
    }

    const maxStake = bankroll.current_balance * 0.05 // Max 5% of bankroll
    const kellyStake = bankroll.current_balance * (valueBet.kelly_percentage / 100)
    const recommendedStake = Math.min(maxStake, kellyStake, 100) // Cap at $100 for safety

    return this.placeBet(userId, {
      matchId: valueBet.match_id,
      valueBetId: valueBet.id,
      betType: valueBet.bet_type,
      stakeAmount: recommendedStake,
      odds: valueBet.bookmaker_odds,
      isSimulation: true,
    })
  }
}
