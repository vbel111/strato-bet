import { SportsDataService } from "@/lib/services/sports-data"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const sportsService = SportsDataService.getInstance()
    
    // Test fetching real matches from The Odds API
    console.log("Testing real sports data APIs...")
    
    const result = await sportsService.fetchExternalMatches(
      "soccer_epl", // English Premier League
      undefined, // dateFrom
      undefined, // dateTo
      1, // page
      10 // pageSize
    )

    return NextResponse.json({
      success: true,
      message: "Successfully fetched external matches",
      data: {
        matchCount: result.matches.length,
        total: result.total,
        hasMore: result.hasMore,
        matches: result.matches.slice(0, 3) // Show first 3 matches
      }
    })

  } catch (error) {
    console.error("Error testing sports data:", error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : String(error)
    })
  }
}
