import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const leagueId = searchParams.get("league_id")

    const supabase = await createClient()

    let query = supabase
      .from("teams")
      .select(`
        *,
        league:leagues(*)
      `)
      .order("name")

    if (leagueId) {
      query = query.eq("league_id", leagueId)
    }

    const { data: teams, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ teams })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
