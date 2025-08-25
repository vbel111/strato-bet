export interface Sport {
  id: string
  name: string
  slug: string
  created_at: string
}

export interface League {
  id: string
  sport_id: string
  name: string
  slug: string
  country: string | null
  created_at: string
  sport?: Sport
}

export interface Team {
  id: string
  league_id: string
  name: string
  slug: string
  logo_url: string | null
  created_at: string
  league?: League
}

export interface Match {
  id: string
  league_id: string
  home_team_id: string
  away_team_id: string
  match_date: string
  status: "scheduled" | "live" | "finished" | "cancelled"
  home_score: number | null
  away_score: number | null
  created_at: string
  updated_at: string
  league?: League
  home_team?: Team
  away_team?: Team
}

export interface ExternalMatchData {
  id: string
  sport_key: string
  sport_title: string
  commence_time: string
  home_team: string
  away_team: string
  bookmakers?: Array<{
    key: string
    title: string
    markets: Array<{
      key: string
      outcomes: Array<{
        name: string
        price: number
      }>
    }>
  }>
}
