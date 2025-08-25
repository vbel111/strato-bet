import { MLPredictionService } from "@/lib/services/ml-prediction"
import { NextResponse } from "next/server"

export async function POST() {
  try {
    const predictionService = MLPredictionService.getInstance()

    await predictionService.generatePredictionsForUpcomingMatches()

    return NextResponse.json({
      success: true,
      message: "Batch prediction generation completed",
    })
  } catch (error) {
    console.error("Error in batch prediction generation:", error)
    return NextResponse.json({ error: "Failed to generate batch predictions" }, { status: 500 })
  }
}
