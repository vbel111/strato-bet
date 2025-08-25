import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sportId = searchParams.get("sport_id")

    const supabase = await createClient()

    let query = supabase
      .from("leagues")
      .select(`
        *,
        sport:sports(*)
      `)
      .order("name")

    if (sportId) {
      query = query.eq("sport_id", sportId)
    }

    const { data: leagues, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ leagues })
  } catch (error) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
