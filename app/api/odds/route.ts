import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const matchId = searchParams.get("match_id")

    const supabase = await createClient()

    let query = supabase
      .from("odds")
      .select(`
        *,
        match:matches(*),
        bookmaker:bookmakers(*)
      `)
      .order("updated_at", { ascending: false })

    if (matchId) {
      query = query.eq("match_id", matchId)
    }

    const { data: odds, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ odds })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
