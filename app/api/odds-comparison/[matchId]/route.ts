import { ValueBetCalculator } from "@/lib/services/value-bet-calculator"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ matchId: string }> }) {
  try {
    const { matchId } = await params

    const calculator = ValueBetCalculator.getInstance()
    const comparison = await calculator.getOddsComparison(matchId)

    if (!comparison) {
      return NextResponse.json({ error: "Match not found or no data available" }, { status: 404 })
    }

    return NextResponse.json({ comparison })
  } catch (error) {
    console.error("Error fetching odds comparison:", error)
    return NextResponse.json({ error: "Failed to fetch odds comparison" }, { status: 500 })
  }
}
