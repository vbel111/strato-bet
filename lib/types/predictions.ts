export interface Prediction {
  id: string
  match_id: string
  model_version: string
  home_win_probability: number
  draw_probability: number | null
  away_win_probability: number
  confidence_score: number
  created_at: string
  match?: any
}

export interface PredictionInput {
  homeTeam: string
  awayTeam: string
  league: string
  homeTeamStats?: TeamStats
  awayTeamStats?: TeamStats
  historicalData?: HistoricalMatch[]
}

export interface TeamStats {
  wins: number
  draws: number
  losses: number
  goalsFor: number
  goalsAgainst: number
  form: string[]
  homeRecord?: Record<string, number>
  awayRecord?: Record<string, number>
}

export interface HistoricalMatch {
  date: string
  homeTeam: string
  awayTeam: string
  homeScore: number
  awayScore: number
  result: "home" | "draw" | "away"
}

export interface MLModelResponse {
  home_win_probability: number
  draw_probability?: number
  away_win_probability: number
  confidence_score: number
  factors: {
    form: number
    head_to_head: number
    home_advantage: number
    team_strength: number
  }
}
