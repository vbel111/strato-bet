import { SportsDataService } from "@/lib/services/sports-data"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { sport = "soccer_epl" } = await request.json()

    const sportsService = SportsDataService.getInstance()

    // Fetch external matches
    const response = await sportsService.fetchExternalMatches(sport)
    const externalMatches = response.matches

    // Sync to database
    await sportsService.syncMatchesToDatabase(externalMatches)

    return NextResponse.json({
      success: true,
      synced: externalMatches.length,
      message: `Successfully synced ${externalMatches.length} matches`,
    })
  } catch (error) {
    console.error("Error syncing matches:", error)
    return NextResponse.json({ error: "Failed to sync matches" }, { status: 500 })
  }
}
