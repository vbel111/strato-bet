import { createClient } from "@/lib/supabase/server"
import type { ExternalMatchData, Team } from "@/lib/types/sports"

export class SportsDataService {
  private static instance: SportsDataService
  private oddsApiKey: string
  private pandaScoreApiKey: string

  private constructor() {
    this.oddsApiKey = process.env.ODDS_API_KEY || ""
    this.pandaScoreApiKey = process.env.PANDASCORE_API_KEY || ""
    
    if (!this.oddsApiKey) {
      console.warn("ODDS_API_KEY not configured - using mock data for traditional sports")
    }
    if (!this.pandaScoreApiKey) {
      console.warn("PANDASCORE_API_KEY not configured - using mock data for esports")
    }
  }

  public static getInstance(): SportsDataService {
    if (!SportsDataService.instance) {
      SportsDataService.instance = new SportsDataService()
    }
    return SportsDataService.instance
  }

  async fetchExternalMatches(
    sport = "soccer_epl",
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ matches: ExternalMatchData[]; total: number; hasMore: boolean }> {
    const isEsport = this.isEsportCategory(sport)

    if (isEsport) {
      return this.fetchEsportsMatches(sport, dateFrom, dateTo, page, pageSize)
    } else {
      return this.fetchTraditionalSportsMatches(sport, dateFrom, dateTo, page, pageSize)
    }
  }

  private isEsportCategory(sport: string): boolean {
    const esportCategories = ["lol", "csgo", "dota2", "valorant", "overwatch", "rocket-league"]
    return esportCategories.some((category) => sport.includes(category))
  }

  private async fetchEsportsMatches(
    sport: string,
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ matches: ExternalMatchData[]; total: number; hasMore: boolean }> {
    if (!this.pandaScoreApiKey) {
      console.warn("PANDASCORE_API_KEY not configured, using mock esports data")
      return this.getMockEsportsMatches(page, pageSize)
    }

    try {
      const gameSlug = this.mapSportToEsportGame(sport)
      let url = `https://api.pandascore.co/${gameSlug}/matches/upcoming?token=${this.pandaScoreApiKey}&page=${page}&per_page=${pageSize}&sort=begin_at`

      if (dateFrom)
        url += `&range[begin_at]=${dateFrom},${dateTo || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()}`

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
          Authorization: `Bearer ${this.pandaScoreApiKey}`,
        },
      })

      if (!response.ok) {
        throw new Error(`PandaScore API request failed: ${response.status}`)
      }

      const data = await response.json()
      const matches = this.transformEsportsData(data)

      return {
        matches: matches.slice(0, pageSize),
        total: data.length,
        hasMore: data.length === pageSize,
      }
    } catch (error) {
      console.error("Error fetching esports matches:", error)
      return this.getMockEsportsMatches(page, pageSize)
    }
  }

  private async fetchTraditionalSportsMatches(
    sport: string,
    dateFrom?: string,
    dateTo?: string,
    page = 1,
    pageSize = 20,
  ): Promise<{ matches: ExternalMatchData[]; total: number; hasMore: boolean }> {
    if (!this.oddsApiKey) {
      console.warn("ODDS_API_KEY not configured, using mock data")
      return this.getMockTraditionalSports(page, pageSize)
    }

    try {
      let url = `https://api.the-odds-api.com/v4/sports/${sport}/odds/?apiKey=${this.oddsApiKey}&regions=uk&markets=h2h&oddsFormat=decimal`

      if (dateFrom) url += `&commenceTimeFrom=${dateFrom}`
      if (dateTo) url += `&commenceTimeTo=${dateTo}`

      const response = await fetch(url, {
        headers: {
          Accept: "application/json",
        },
      })

      if (!response.ok) {
        throw new Error(`Odds API request failed: ${response.status}`)
      }

      const data = await response.json()

      const sortedMatches = data.sort(
        (a: any, b: any) => new Date(a.commence_time).getTime() - new Date(b.commence_time).getTime(),
      )

      const startIndex = (page - 1) * pageSize
      const paginatedMatches = sortedMatches.slice(startIndex, startIndex + pageSize)

      return {
        matches: paginatedMatches,
        total: sortedMatches.length,
        hasMore: startIndex + pageSize < sortedMatches.length,
      }
    } catch (error) {
      console.error("Error fetching traditional sports matches:", error)
      return this.getMockTraditionalSports(page, pageSize)
    }
  }

  private mapSportToEsportGame(sport: string): string {
    const mapping: { [key: string]: string } = {
      lol: "lol",
      csgo: "csgo",
      dota2: "dota-2",
      valorant: "valorant",
      overwatch: "overwatch",
      "rocket-league": "rocket-league",
    }
    return mapping[sport] || "lol"
  }

  private transformEsportsData(esportsData: any[]): ExternalMatchData[] {
    return esportsData.map((match) => ({
      id: match.id.toString(),
      sport_key: match.videogame?.slug || "esports",
      sport_title: match.league?.name || "Esports",
      commence_time: match.begin_at,
      home_team: match.opponents?.[0]?.opponent?.name || "Team 1",
      away_team: match.opponents?.[1]?.opponent?.name || "Team 2",
      bookmakers: [], // Esports odds would need separate integration
    }))
  }

  private getMockEsportsMatches(
    page = 1,
    pageSize = 20,
  ): { matches: ExternalMatchData[]; total: number; hasMore: boolean } {
    const now = new Date()
    const mockMatches = [
      {
        id: "esport_mock_1",
        sport_key: "lol",
        sport_title: "League of Legends - LEC",
        commence_time: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(),
        home_team: "G2 Esports",
        away_team: "Fnatic",
        bookmakers: [],
      },
      {
        id: "esport_mock_2",
        sport_key: "csgo",
        sport_title: "CS:GO - ESL Pro League",
        commence_time: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(),
        home_team: "Astralis",
        away_team: "NAVI",
        bookmakers: [],
      },
    ]

    const startIndex = (page - 1) * pageSize
    const paginatedMatches = mockMatches.slice(startIndex, startIndex + pageSize)

    return {
      matches: paginatedMatches,
      total: mockMatches.length,
      hasMore: startIndex + pageSize < mockMatches.length,
    }
  }

  private getMockTraditionalSports(
    page = 1,
    pageSize = 20,
  ): { matches: ExternalMatchData[]; total: number; hasMore: boolean } {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    const mockMatches = [
      {
        id: "mock_1",
        sport_key: "soccer_epl",
        sport_title: "Premier League",
        commence_time: tomorrow.toISOString(),
        home_team: "Manchester City",
        away_team: "Liverpool",
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Manchester City", price: 2.1 },
                  { name: "Draw", price: 3.4 },
                  { name: "Liverpool", price: 3.2 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "mock_2",
        sport_key: "soccer_epl",
        sport_title: "Premier League",
        commence_time: dayAfter.toISOString(),
        home_team: "Arsenal",
        away_team: "Chelsea",
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Arsenal", price: 1.85 },
                  { name: "Draw", price: 3.6 },
                  { name: "Chelsea", price: 4.2 },
                ],
              },
            ],
          },
        ],
      },
    ]

    const startIndex = (page - 1) * pageSize
    const paginatedMatches = mockMatches.slice(startIndex, startIndex + pageSize)

    return {
      matches: paginatedMatches,
      total: mockMatches.length,
      hasMore: startIndex + pageSize < mockMatches.length,
    }
  }

  private getMockMatches(): ExternalMatchData[] {
    const now = new Date()
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000)
    const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000)

    return [
      {
        id: "mock_1",
        sport_key: "soccer_epl",
        sport_title: "Premier League",
        commence_time: tomorrow.toISOString(),
        home_team: "Manchester City",
        away_team: "Liverpool",
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Manchester City", price: 2.1 },
                  { name: "Draw", price: 3.4 },
                  { name: "Liverpool", price: 3.2 },
                ],
              },
            ],
          },
        ],
      },
      {
        id: "mock_2",
        sport_key: "soccer_epl",
        sport_title: "Premier League",
        commence_time: dayAfter.toISOString(),
        home_team: "Arsenal",
        away_team: "Chelsea",
        bookmakers: [
          {
            key: "bet365",
            title: "Bet365",
            markets: [
              {
                key: "h2h",
                outcomes: [
                  { name: "Arsenal", price: 1.85 },
                  { name: "Draw", price: 3.6 },
                  { name: "Chelsea", price: 4.2 },
                ],
              },
            ],
          },
        ],
      },
    ]
  }

  async syncMatchesToDatabase(externalMatches: ExternalMatchData[]): Promise<void> {
    const supabase = await createClient()

    for (const externalMatch of externalMatches) {
      try {
        // Find or create league
        let { data: league } = await supabase
          .from("leagues")
          .select("*")
          .eq("slug", this.slugify(externalMatch.sport_title))
          .single()

        if (!league) {
          const { data: sport } = await supabase.from("sports").select("*").eq("slug", "football").single()

          if (sport) {
            const { data: newLeague } = await supabase
              .from("leagues")
              .insert({
                sport_id: sport.id,
                name: externalMatch.sport_title,
                slug: this.slugify(externalMatch.sport_title),
                country: "England",
              })
              .select()
              .single()

            league = newLeague
          }
        }

        if (!league) continue

        // Find or create teams
        const homeTeam = await this.findOrCreateTeam(externalMatch.home_team, league.id)
        const awayTeam = await this.findOrCreateTeam(externalMatch.away_team, league.id)

        if (!homeTeam || !awayTeam) continue

        // Create or update match
        await supabase.from("matches").upsert({
          id: externalMatch.id,
          league_id: league.id,
          home_team_id: homeTeam.id,
          away_team_id: awayTeam.id,
          match_date: externalMatch.commence_time,
          status: "scheduled",
        })

        // Store odds if available
        if (externalMatch.bookmakers) {
          await this.storeOdds(externalMatch.id, externalMatch.bookmakers)
        }
      } catch (error) {
        console.error(`Error syncing match ${externalMatch.id}:`, error)
      }
    }
  }

  private async findOrCreateTeam(teamName: string, leagueId: string): Promise<Team | null> {
    const supabase = await createClient()

    let { data: team } = await supabase
      .from("teams")
      .select("*")
      .eq("slug", this.slugify(teamName))
      .eq("league_id", leagueId)
      .single()

    if (!team) {
      const { data: newTeam } = await supabase
        .from("teams")
        .insert({
          league_id: leagueId,
          name: teamName,
          slug: this.slugify(teamName),
        })
        .select()
        .single()

      team = newTeam
    }

    return team
  }

  private async storeOdds(matchId: string, bookmakers: any[]): Promise<void> {
    const supabase = await createClient()

    for (const bookmaker of bookmakers) {
      // Find or create bookmaker
      let { data: bookmakerId } = await supabase
        .from("bookmakers")
        .select("id")
        .eq("slug", this.slugify(bookmaker.title))
        .single()

      if (!bookmakerId) {
        const { data: newBookmaker } = await supabase
          .from("bookmakers")
          .insert({
            name: bookmaker.title,
            slug: this.slugify(bookmaker.title),
          })
          .select("id")
          .single()

        bookmakerId = newBookmaker
      }

      if (!bookmakerId) continue

      // Store odds
      for (const market of bookmaker.markets) {
        if (market.key === "h2h" && market.outcomes.length >= 2) {
          const homeOdds = market.outcomes.find((o: any) => o.name === bookmaker.title)?.price
          const drawOdds = market.outcomes.find((o: any) => o.name === "Draw")?.price
          const awayOdds = market.outcomes.find((o: any) => o.name !== bookmaker.title && o.name !== "Draw")?.price

          await supabase.from("odds").upsert({
            match_id: matchId,
            bookmaker_id: bookmakerId.id,
            market_type: "1x2",
            home_odds: homeOdds,
            draw_odds: drawOdds,
            away_odds: awayOdds,
          })
        }
      }
    }
  }

  private slugify(text: string): string {
    return text
      .toLowerCase()
      .replace(/[^\w\s-]/g, "")
      .replace(/[\s_-]+/g, "-")
      .replace(/^-+|-+$/g, "")
  }
}
