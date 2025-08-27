import { createClient } from "@/lib/supabase/server"
import { SportsDataService } from "@/lib/services/sports-data"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const sport = searchParams.get("sport") || "soccer_epl"
    const page = Number.parseInt(searchParams.get("page") || "1")
    const pageSize = Number.parseInt(searchParams.get("page_size") || "20")

    const supabase = await createClient()
    const sportsService = SportsDataService.getInstance()
    
    // Always fetch from external APIs for real data
    const externalData = await sportsService.fetchExternalMatches(
      sport,
      undefined,
      undefined,
      page,
      pageSize,
    )

    // Sync external matches to database for consistency
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
  } catch (error) {
    console.error("Error fetching matches:", error)
    return NextResponse.json({ error: "Failed to fetch matches" }, { status: 500 })
  }
}
