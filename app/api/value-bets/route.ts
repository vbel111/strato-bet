import { ValueBetCalculator } from "@/lib/services/value-bet-calculator"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = Number.parseInt(searchParams.get("limit") || "20")

    const calculator = ValueBetCalculator.getInstance()
    const valueBets = await calculator.getBestValueBets(limit)

    return NextResponse.json({ value_bets: valueBets })
  } catch (error) {
    console.error("Error fetching value bets:", error)
    return NextResponse.json({ error: "Failed to fetch value bets" }, { status: 500 })
  }
}
