import { createClient } from "@/lib/supabase/server"
import { z } from "zod"
import type { PredictionInput, MLModelResponse, TeamStats, HistoricalMatch } from "@/lib/types/predictions"

const predictionSchema = z.object({
  home_win_probability: z.number().min(0).max(1),
  draw_probability: z.number().min(0).max(1).optional(),
  away_win_probability: z.number().min(0).max(1),
  confidence_score: z.number().min(0).max(1),
  factors: z.object({
    form: z.number().min(0).max(1),
    head_to_head: z.number().min(0).max(1),
    home_advantage: z.number().min(0).max(1),
    team_strength: z.number().min(0).max(1),
  }),
  reasoning: z.string(),
})

export class MLPredictionService {
  private static instance: MLPredictionService
  private modelVersion = "v1.0.0"
  private openaiApiKey: string

  private constructor() {
    this.openaiApiKey = process.env.OPENAI_API_KEY || ""
  }

  public static getInstance(): MLPredictionService {
    if (!MLPredictionService.instance) {
      MLPredictionService.instance = new MLPredictionService()
    }
    return MLPredictionService.instance
  }

  async generatePrediction(input: PredictionInput): Promise<MLModelResponse> {
    try {
      if (!this.openaiApiKey) {
        console.info("OpenAI API key not configured, using fallback prediction model")
        return this.getFallbackPrediction(input)
      }

      // Use OpenAI API directly for predictions
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.openaiApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: 'You are an expert sports betting analyst. Analyze matches and provide win probabilities as JSON only. Return exactly this format: {"home_win_probability": 0.45, "draw_probability": 0.25, "away_win_probability": 0.30, "confidence_score": 0.75, "factors": {"form": 0.8, "head_to_head": 0.6, "home_advantage": 0.7, "team_strength": 0.75}, "reasoning": "brief analysis"}'
            },
            {
              role: 'user',
              content: this.buildPredictionPrompt(input)
            }
          ],
          max_tokens: 500,
          temperature: 0.1,
        }),
      })

      if (!response.ok) {
        throw new Error(`OpenAI API error: ${response.status}`)
      }

      const data = await response.json()
      const content = data.choices[0]?.message?.content

      if (!content) {
        throw new Error('No response from OpenAI')
      }

      // Parse the JSON response
      const prediction = JSON.parse(content)
      
      // Validate that probabilities sum to approximately 1
      const total = (prediction.home_win_probability || 0) + (prediction.draw_probability || 0) + (prediction.away_win_probability || 0)
      if (Math.abs(total - 1.0) > 0.1) {
        console.warn("AI prediction probabilities don't sum to 1, using fallback")
        return this.getFallbackPrediction(input)
      }

      return {
        home_win_probability: prediction.home_win_probability,
        draw_probability: prediction.draw_probability || 0,
        away_win_probability: prediction.away_win_probability,
        confidence_score: prediction.confidence_score,
        factors: prediction.factors,
      }
    } catch (error) {
      console.error("Error generating AI prediction:", error)
      return this.getFallbackPrediction(input)
    }
  }

  private buildPredictionPrompt(input: PredictionInput): string {
    return `
You are an expert sports betting analyst with deep knowledge of football/soccer. Analyze the upcoming match and provide accurate win probabilities.

Match Details:
- Home Team: ${input.homeTeam}
- Away Team: ${input.awayTeam}
- League: ${input.league}

${
  input.homeTeamStats
    ? `
Home Team Stats:
- Record: ${input.homeTeamStats.wins}W-${input.homeTeamStats.draws}D-${input.homeTeamStats.losses}L
- Goals: ${input.homeTeamStats.goalsFor} scored, ${input.homeTeamStats.goalsAgainst} conceded
- Recent Form: ${input.homeTeamStats.form.join(", ")}
`
    : ""
}

${
  input.awayTeamStats
    ? `
Away Team Stats:
- Record: ${input.awayTeamStats.wins}W-${input.awayTeamStats.draws}D-${input.awayTeamStats.losses}L
- Goals: ${input.awayTeamStats.goalsFor} scored, ${input.awayTeamStats.goalsAgainst} conceded
- Recent Form: ${input.awayTeamStats.form.join(", ")}
`
    : ""
}

${
  input.historicalData?.length
    ? `
Head-to-Head History (last ${input.historicalData.length} matches):
${input.historicalData
  .map(
    (match) =>
      `${match.date}: ${match.homeTeam} ${match.homeScore}-${match.awayScore} ${match.awayTeam} (${match.result})`,
  )
  .join("\n")}
`
    : ""
}

Analyze these factors:
1. Current form and momentum
2. Head-to-head record
3. Home advantage
4. Team strength and quality
5. Injuries and suspensions (if known)
6. Tactical matchups

Provide probabilities that sum to 1.0 and a confidence score based on data quality and predictability.
The confidence score should reflect how certain you are about the prediction (0.0 = very uncertain, 1.0 = very certain).

Consider that home teams typically have a 5-10% advantage, and recent form is more important than historical records.
    `
  }

  private getFallbackPrediction(input: PredictionInput): MLModelResponse {
    // Improved fallback model with more realistic calculations
    let homeProb = 0.40 // Base home advantage (slightly higher than away)
    let drawProb = 0.27
    let awayProb = 0.33

    let confidenceScore = 0.5 // Base confidence
    let formFactor = 0.5
    let h2hFactor = 0.5
    let strengthFactor = 0.5

    // Adjust based on team stats if available
    if (input.homeTeamStats && input.awayTeamStats) {
      const homeStrength = this.calculateTeamStrength(input.homeTeamStats)
      const awayStrength = this.calculateTeamStrength(input.awayTeamStats)
      const strengthDiff = homeStrength - awayStrength

      // More nuanced probability adjustments
      const adjustment = Math.min(0.15, Math.max(-0.15, strengthDiff * 0.3))
      homeProb += adjustment
      awayProb -= adjustment * 0.8 // Slightly less impact on away
      drawProb += adjustment * 0.2 // Draw slightly more likely with strong teams

      // Update factors
      formFactor = (this.calculateFormScore(input.homeTeamStats.form) + 
                   this.calculateFormScore(input.awayTeamStats.form)) / 2
      strengthFactor = Math.abs(strengthDiff) // Higher difference = more certain
      confidenceScore = Math.min(0.8, 0.4 + strengthFactor * 0.4)
    }

    // Historical data impact
    if (input.historicalData && input.historicalData.length > 0) {
      h2hFactor = 0.7
      confidenceScore += 0.1
    }

    // Normalize probabilities to ensure they sum to 1
    const total = homeProb + drawProb + awayProb
    homeProb /= total
    drawProb /= total
    awayProb /= total

    // Ensure reasonable bounds
    return {
      home_win_probability: Math.max(0.15, Math.min(0.75, homeProb)),
      draw_probability: Math.max(0.10, Math.min(0.45, drawProb)),
      away_win_probability: Math.max(0.15, Math.min(0.75, awayProb)),
      confidence_score: Math.max(0.3, Math.min(0.8, confidenceScore)),
      factors: {
        form: formFactor,
        head_to_head: h2hFactor,
        home_advantage: 0.65, // Home advantage is generally consistent
        team_strength: strengthFactor,
      },
    }
  }

  private calculateTeamStrength(stats: TeamStats): number {
    const totalGames = stats.wins + stats.draws + stats.losses
    if (totalGames === 0) return 0.5

    const winRate = stats.wins / totalGames
    const goalDiff = (stats.goalsFor - stats.goalsAgainst) / totalGames
    const formScore = this.calculateFormScore(stats.form)

    return winRate * 0.4 + Math.max(-1, Math.min(1, goalDiff)) * 0.3 + formScore * 0.3
  }

  private calculateFormScore(form: string[]): number {
    if (form.length === 0) return 0.5

    const points = form.reduce((total, result) => {
      switch (result.toLowerCase()) {
        case "w":
          return total + 1
        case "d":
          return total + 0.5
        case "l":
          return total + 0
        default:
          return total
      }
    }, 0)

    return points / form.length
  }

  async storePrediction(matchId: string, prediction: MLModelResponse): Promise<void> {
    const supabase = await createClient()

    await supabase.from("predictions").upsert({
      match_id: matchId,
      model_version: this.modelVersion,
      home_win_probability: prediction.home_win_probability,
      draw_probability: prediction.draw_probability,
      away_win_probability: prediction.away_win_probability,
      confidence_score: prediction.confidence_score,
    })
  }

  async getPredictionsForMatch(matchId: string) {
    const supabase = await createClient()

    const { data: predictions, error } = await supabase
      .from("predictions")
      .select("*")
      .eq("match_id", matchId)
      .order("created_at", { ascending: false })

    if (error) {
      throw new Error(`Failed to fetch predictions: ${error.message}`)
    }

    return predictions
  }

  async generatePredictionsForUpcomingMatches(): Promise<void> {
    const supabase = await createClient()

    // Get upcoming matches without predictions
    const { data: matches } = await supabase
      .from("matches")
      .select(`
        *,
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        league:leagues(*)
      `)
      .eq("status", "scheduled")
      .gte("match_date", new Date().toISOString())
      .is("predictions.id", null)
      .limit(10)

    if (!matches) return

    for (const match of matches) {
      try {
        const input: PredictionInput = {
          homeTeam: match.home_team.name,
          awayTeam: match.away_team.name,
          league: match.league.name,
          // In a real system, you'd fetch actual team stats here
          homeTeamStats: await this.getTeamStats(match.home_team_id),
          awayTeamStats: await this.getTeamStats(match.away_team_id),
          historicalData: await this.getHeadToHeadData(match.home_team_id, match.away_team_id),
        }

        const prediction = await this.generatePrediction(input)
        await this.storePrediction(match.id, prediction)

        console.log(`Generated prediction for ${match.home_team.name} vs ${match.away_team.name}`)
      } catch (error) {
        console.error(`Error generating prediction for match ${match.id}:`, error)
      }
    }
  }

  private async getTeamStats(teamId: string): Promise<TeamStats> {
    // TODO: In a real system, this would fetch actual team statistics from the database
    // For now, return realistic mock data based on team performance tiers
    
    const supabase = await createClient()
    
    try {
      // Try to get team name for more realistic stats
      const { data: team } = await supabase
        .from("teams")
        .select("name")
        .eq("id", teamId)
        .single()
      
      // Generate stats based on team name hash for consistency
      const teamHash = team?.name ? this.hashString(team.name) : Math.random()
      const tier = teamHash % 3 // 0 = strong, 1 = medium, 2 = weak
      
      let baseWins, baseLosses, baseGoalsFor, baseGoalsAgainst
      
      switch (tier) {
        case 0: // Strong team
          baseWins = 12 + Math.floor(teamHash * 6)
          baseLosses = 2 + Math.floor(teamHash * 4)
          baseGoalsFor = 35 + Math.floor(teamHash * 15)
          baseGoalsAgainst = 15 + Math.floor(teamHash * 10)
          break
        case 1: // Medium team  
          baseWins = 8 + Math.floor(teamHash * 6)
          baseLosses = 6 + Math.floor(teamHash * 6)
          baseGoalsFor = 25 + Math.floor(teamHash * 15)
          baseGoalsAgainst = 25 + Math.floor(teamHash * 15)
          break
        default: // Weak team
          baseWins = 4 + Math.floor(teamHash * 6)
          baseLosses = 10 + Math.floor(teamHash * 8)
          baseGoalsFor = 18 + Math.floor(teamHash * 12)
          baseGoalsAgainst = 30 + Math.floor(teamHash * 20)
      }
      
      const totalGames = baseWins + baseLosses + (3 + Math.floor(teamHash * 5)) // draws
      const draws = totalGames - baseWins - baseLosses
      
      // Generate realistic form based on recent performance
      const formResults = []
      for (let i = 0; i < 5; i++) {
        const rand = (teamHash + i * 0.1) % 1
        if (tier === 0) { // Strong team - more wins
          formResults.push(rand < 0.6 ? 'W' : rand < 0.85 ? 'D' : 'L')
        } else if (tier === 1) { // Medium team - balanced
          formResults.push(rand < 0.4 ? 'W' : rand < 0.7 ? 'D' : 'L')
        } else { // Weak team - more losses
          formResults.push(rand < 0.25 ? 'W' : rand < 0.5 ? 'D' : 'L')
        }
      }
      
      return {
        wins: baseWins,
        draws: draws,
        losses: baseLosses,
        goalsFor: baseGoalsFor,
        goalsAgainst: baseGoalsAgainst,
        form: formResults,
      }
    } catch (error) {
      console.warn("Error fetching team data, using random stats:", error)
      // Fallback to random stats
      return {
        wins: Math.floor(Math.random() * 15) + 5,
        draws: Math.floor(Math.random() * 8) + 2,
        losses: Math.floor(Math.random() * 10) + 1,
        goalsFor: Math.floor(Math.random() * 30) + 20,
        goalsAgainst: Math.floor(Math.random() * 25) + 10,
        form: ["W", "W", "D", "L", "W"].slice(0, Math.floor(Math.random() * 5) + 3),
      }
    }
  }

  // Simple hash function for consistent team stats
  private hashString(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash) / 2147483647 // Normalize to 0-1
  }

  private async getHeadToHeadData(homeTeamId: string, awayTeamId: string): Promise<HistoricalMatch[]> {
    // In a real system, this would fetch actual head-to-head data
    // For now, return mock data
    return [
      {
        date: "2024-01-15",
        homeTeam: "Team A",
        awayTeam: "Team B",
        homeScore: 2,
        awayScore: 1,
        result: "home",
      },
    ]
  }
}
