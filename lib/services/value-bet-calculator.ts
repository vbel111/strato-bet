import { createClient } from "@/lib/supabase/server"

export interface ValueBetOpportunity {
  id: string
  match_id: string
  prediction_id: string
  odds_id: string
  bet_type: "home" | "draw" | "away"
  predicted_probability: number
  bookmaker_odds: number
  implied_probability: number
  value_percentage: number
  kelly_percentage: number
  bookmaker_name: string
  match_info: {
    home_team: string
    away_team: string
    league: string
    match_date: string
  }
  confidence_score: number
  expected_value: number
}

export class ValueBetCalculator {
  private static instance: ValueBetCalculator

  private constructor() {}

  public static getInstance(): ValueBetCalculator {
    if (!ValueBetCalculator.instance) {
      ValueBetCalculator.instance = new ValueBetCalculator()
    }
    return ValueBetCalculator.instance
  }

  async calculateValueBets(): Promise<ValueBetOpportunity[]> {
    const supabase = await createClient()

    // Get matches with both predictions and odds
    const { data: matches } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        league:leagues(name),
        predictions(*),
        odds(*, bookmaker:bookmakers(*))
      `)
      .eq("status", "scheduled")
      .gte("match_date", new Date().toISOString())
      .not("predictions", "is", null)
      .not("odds", "is", null)

    if (!matches) return []

    const valueBets: ValueBetOpportunity[] = []

    for (const match of matches) {
      if (!match.predictions?.length || !match.odds?.length) continue

      const latestPrediction = match.predictions[0] // Most recent prediction

      for (const odds of match.odds) {
        // Calculate value for home win
        const homeValue = this.calculateValue(latestPrediction.home_win_probability, odds.home_odds)

        if (homeValue.hasValue && homeValue.valuePercentage >= 5) {
          // Minimum 5% value
          valueBets.push({
            id: `${match.id}_${odds.id}_home`,
            match_id: match.id,
            prediction_id: latestPrediction.id,
            odds_id: odds.id,
            bet_type: "home",
            predicted_probability: latestPrediction.home_win_probability,
            bookmaker_odds: odds.home_odds,
            implied_probability: 1 / odds.home_odds,
            value_percentage: homeValue.valuePercentage,
            kelly_percentage: this.calculateKelly(latestPrediction.home_win_probability, odds.home_odds),
            bookmaker_name: odds.bookmaker.name,
            match_info: {
              home_team: match.home_team.name,
              away_team: match.away_team.name,
              league: match.league.name,
              match_date: match.match_date,
            },
            confidence_score: latestPrediction.confidence_score,
            expected_value: this.calculateExpectedValue(latestPrediction.home_win_probability, odds.home_odds),
          })
        }

        // Calculate value for draw (if available)
        if (latestPrediction.draw_probability && odds.draw_odds) {
          const drawValue = this.calculateValue(latestPrediction.draw_probability, odds.draw_odds)

          if (drawValue.hasValue && drawValue.valuePercentage >= 5) {
            valueBets.push({
              id: `${match.id}_${odds.id}_draw`,
              match_id: match.id,
              prediction_id: latestPrediction.id,
              odds_id: odds.id,
              bet_type: "draw",
              predicted_probability: latestPrediction.draw_probability,
              bookmaker_odds: odds.draw_odds,
              implied_probability: 1 / odds.draw_odds,
              value_percentage: drawValue.valuePercentage,
              kelly_percentage: this.calculateKelly(latestPrediction.draw_probability, odds.draw_odds),
              bookmaker_name: odds.bookmaker.name,
              match_info: {
                home_team: match.home_team.name,
                away_team: match.away_team.name,
                league: match.league.name,
                match_date: match.match_date,
              },
              confidence_score: latestPrediction.confidence_score,
              expected_value: this.calculateExpectedValue(latestPrediction.draw_probability, odds.draw_odds),
            })
          }
        }

        // Calculate value for away win
        const awayValue = this.calculateValue(latestPrediction.away_win_probability, odds.away_odds)

        if (awayValue.hasValue && awayValue.valuePercentage >= 5) {
          valueBets.push({
            id: `${match.id}_${odds.id}_away`,
            match_id: match.id,
            prediction_id: latestPrediction.id,
            odds_id: odds.id,
            bet_type: "away",
            predicted_probability: latestPrediction.away_win_probability,
            bookmaker_odds: odds.away_odds,
            implied_probability: 1 / odds.away_odds,
            value_percentage: awayValue.valuePercentage,
            kelly_percentage: this.calculateKelly(latestPrediction.away_win_probability, odds.away_odds),
            bookmaker_name: odds.bookmaker.name,
            match_info: {
              home_team: match.home_team.name,
              away_team: match.away_team.name,
              league: match.league.name,
              match_date: match.match_date,
            },
            confidence_score: latestPrediction.confidence_score,
            expected_value: this.calculateExpectedValue(latestPrediction.away_win_probability, odds.away_odds),
          })
        }
      }
    }

    // Sort by value percentage descending
    return valueBets.sort((a, b) => b.value_percentage - a.value_percentage)
  }

  private calculateValue(
    predictedProbability: number,
    bookmakerOdds: number,
  ): { hasValue: boolean; valuePercentage: number } {
    const impliedProbability = 1 / bookmakerOdds
    const valuePercentage = ((predictedProbability - impliedProbability) / impliedProbability) * 100

    return {
      hasValue: valuePercentage > 0,
      valuePercentage: Math.round(valuePercentage * 100) / 100,
    }
  }

  private calculateKelly(probability: number, odds: number): number {
    // Kelly Criterion: f = (bp - q) / b
    // where f = fraction of bankroll to bet
    // b = odds received on the wager (odds - 1)
    // p = probability of winning
    // q = probability of losing (1 - p)

    const b = odds - 1
    const p = probability
    const q = 1 - p

    const kelly = (b * p - q) / b

    // Cap Kelly at 25% for risk management
    return Math.max(0, Math.min(0.25, kelly)) * 100
  }

  private calculateExpectedValue(probability: number, odds: number): number {
    // EV = (probability × (odds - 1)) - (1 - probability)
    return probability * (odds - 1) - (1 - probability)
  }

  async storeValueBets(valueBets: ValueBetOpportunity[]): Promise<void> {
    const supabase = await createClient()

    // Clear existing value bets for today
    const today = new Date().toISOString().split("T")[0]
    await supabase.from("value_bets").delete().gte("created_at", `${today}T00:00:00.000Z`)

    // Insert new value bets
    const valueBetRecords = valueBets.map((bet) => ({
      match_id: bet.match_id,
      prediction_id: bet.prediction_id,
      odds_id: bet.odds_id,
      bet_type: bet.bet_type,
      predicted_probability: bet.predicted_probability,
      bookmaker_odds: bet.bookmaker_odds,
      implied_probability: bet.implied_probability,
      value_percentage: bet.value_percentage,
      kelly_percentage: bet.kelly_percentage,
    }))

    if (valueBetRecords.length > 0) {
      await supabase.from("value_bets").insert(valueBetRecords)
    }
  }

  async getBestValueBets(limit = 20): Promise<ValueBetOpportunity[]> {
    const supabase = await createClient()

    const { data: valueBets } = await supabase
      .from("value_bets")
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!matches_home_team_id_fkey(name),
          away_team:teams!matches_away_team_id_fkey(name),
          league:leagues(name)
        ),
        prediction:predictions(*),
        odds:odds(*, bookmaker:bookmakers(*))
      `)
      .order("value_percentage", { ascending: false })
      .limit(limit)

    if (!valueBets) return []

    return valueBets.map((bet) => ({
      id: bet.id,
      match_id: bet.match_id,
      prediction_id: bet.prediction_id,
      odds_id: bet.odds_id,
      bet_type: bet.bet_type,
      predicted_probability: bet.predicted_probability,
      bookmaker_odds: bet.bookmaker_odds,
      implied_probability: bet.implied_probability,
      value_percentage: bet.value_percentage,
      kelly_percentage: bet.kelly_percentage,
      bookmaker_name: bet.odds.bookmaker.name,
      match_info: {
        home_team: bet.match.home_team.name,
        away_team: bet.match.away_team.name,
        league: bet.match.league.name,
        match_date: bet.match.match_date,
      },
      confidence_score: bet.prediction.confidence_score,
      expected_value: this.calculateExpectedValue(bet.predicted_probability, bet.bookmaker_odds),
    }))
  }

  async getOddsComparison(matchId: string) {
    const supabase = await createClient()

    const { data: comparison } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(name),
        away_team:teams!matches_away_team_id_fkey(name),
        league:leagues(name),
        predictions(*),
        odds(*, bookmaker:bookmakers(*))
      `)
      .eq("id", matchId)
      .single()

    if (!comparison) return null

    const prediction = comparison.predictions?.[0]
    if (!prediction) return null

    const oddsComparison = comparison.odds.map((odds) => ({
      bookmaker: odds.bookmaker.name,
      home_odds: odds.home_odds,
      draw_odds: odds.draw_odds,
      away_odds: odds.away_odds,
      home_implied: odds.home_odds ? 1 / odds.home_odds : 0,
      draw_implied: odds.draw_odds ? 1 / odds.draw_odds : 0,
      away_implied: odds.away_odds ? 1 / odds.away_odds : 0,
      home_value: odds.home_odds ? this.calculateValue(prediction.home_win_probability, odds.home_odds) : null,
      draw_value:
        odds.draw_odds && prediction.draw_probability
          ? this.calculateValue(prediction.draw_probability, odds.draw_odds)
          : null,
      away_value: odds.away_odds ? this.calculateValue(prediction.away_win_probability, odds.away_odds) : null,
    }))

    return {
      match: {
        home_team: comparison.home_team.name,
        away_team: comparison.away_team.name,
        league: comparison.league.name,
        match_date: comparison.match_date,
      },
      prediction: {
        home_win_probability: prediction.home_win_probability,
        draw_probability: prediction.draw_probability,
        away_win_probability: prediction.away_win_probability,
        confidence_score: prediction.confidence_score,
      },
      odds_comparison: oddsComparison,
    }
  }
}
