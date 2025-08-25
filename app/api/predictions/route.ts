import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("match_id")
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const supabase = await createClient()

    let query = supabase
      .from("predictions")
      .select(`
        *,
        match:matches(
          *,
          home_team:teams!matches_home_team_id_fkey(*),
          away_team:teams!matches_away_team_id_fkey(*),
          league:leagues(*)
        )
      `)
      .order("created_at", { ascending: false })
      .limit(limit)

    if (matchId) {
      query = query.eq("match_id", matchId)
    }

    const { data: predictions, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ predictions })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
