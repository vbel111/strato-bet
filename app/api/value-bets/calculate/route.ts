import { ValueBetCalculator } from "@/lib/services/value-bet-calculator"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const calculator = ValueBetCalculator.getInstance()

    // Calculate current value bets
    const valueBets = await calculator.calculateValueBets()

    // Store them in the database
    await calculator.storeValueBets(valueBets)

    return NextResponse.json({
      success: true,
      calculated: valueBets.length,
      message: `Successfully calculated ${valueBets.length} value bets`,
    })
  } catch (error) {
    console.error("Error calculating value bets:", error)
    return NextResponse.json({ error: "Failed to calculate value bets" }, { status: 500 })
  }
}
