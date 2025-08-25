import { MLPredictionService } from "@/lib/services/ml-prediction"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const { matchId, homeTeam, awayTeam, league } = await request.json()

    if (!matchId || !homeTeam || !awayTeam || !league) {
      return NextResponse.json(
        { error: "Missing required fields: matchId, homeTeam, awayTeam, league" },
        { status: 400 },
      )
    }

    const predictionService = MLPredictionService.getInstance()

    const prediction = await predictionService.generatePrediction({
      homeTeam,
      awayTeam,
      league,
    })

    await predictionService.storePrediction(matchId, prediction)

    return NextResponse.json({
      success: true,
      prediction,
      message: "Prediction generated successfully",
    })
  } catch (error) {
    console.error("Error generating prediction:", error)
    return NextResponse.json({ error: "Failed to generate prediction" }, { status: 500 })
  }
}
