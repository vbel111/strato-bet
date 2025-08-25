import { createClient } from "@/lib/supabase/server"
import { SportsDataService } from "@/lib/services/sports-data"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get("league_id")
    const status = searchParams.get("status")
    const date = searchParams.get("date")
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("page_size") || "20")
    const dateFrom = searchParams.get("date_from")
    const dateTo = searchParams.get("date_to")
    const sport = searchParams.get("sport") || "soccer_epl"
    const includeExternal = searchParams.get("include_external") === "true"

    const supabase = await createClient()

    if (includeExternal) {
      const sportsService = SportsDataService.getInstance()
      const externalData = await sportsService.fetchExternalMatches(
        sport,
        dateFrom || undefined,
        dateTo || undefined,
        page,
        pageSize,
      )

      // Sync external matches to database
      if (externalData.matches.length > 0) {
        await sportsService.syncMatchesToDatabase(externalData.matches)
      }

      return NextResponse.json({
        matches: externalData.matches,
        pagination: {
          page,
          pageSize,
          total: externalData.total,
          hasMore: externalData.hasMore,
        },
      })
    }

    let query = supabase
      .from("matches")
      .select(`
        *,
        league:leagues(*),
        home_team:teams!matches_home_team_id_fkey(*),
        away_team:teams!matches_away_team_id_fkey(*),
        predictions(*),
        odds(*)
      `)
      .order("match_date", { ascending: true })

    if (leagueId) {
      query = query.eq("league_id", leagueId)
    }

    if (status) {
      query = query.eq("status", status)
    }

    if (date) {
      const startDate = new Date(date)
      const endDate = new Date(startDate)
      endDate.setDate(endDate.getDate() + 1)
      query = query.gte("match_date", startDate.toISOString()).lt("match_date", endDate.toISOString())
    } else if (dateFrom || dateTo) {
      if (dateFrom) {
        query = query.gte("match_date", new Date(dateFrom).toISOString())
      }
      if (dateTo) {
        query = query.lte("match_date", new Date(dateTo).toISOString())
      }
    }

    const startIndex = (page - 1) * pageSize
    query = query.range(startIndex, startIndex + pageSize - 1)

    const { data: matches, error, count } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({
      matches,
      pagination: {
        page,
        pageSize,
        total: count || 0,
        hasMore: (count || 0) > startIndex + pageSize,
      },
    })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
