"use client"

import { useState, useEffect } from "react"
import type { Prediction } from "@/lib/types/predictions"

export function usePredictions(matchId?: string) {
  const [predictions, setPredictions] = useState<Prediction[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchPredictions() {
      try {
        const url = matchId ? `/api/predictions?match_id=${matchId}` : "/api/predictions"
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch predictions")
        }

        setPredictions(data.predictions)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchPredictions()
  }, [matchId])

  const generatePrediction = async (matchData: {
    matchId: string
    homeTeam: string
    awayTeam: string
    league: string
  }) => {
    try {
      setLoading(true)
      const response = await fetch("/api/predictions/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(matchData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate prediction")
      }

      // Refresh predictions
      window.location.reload()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const generateBatchPredictions = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/predictions/batch", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to generate batch predictions")
      }

      // Refresh predictions
      window.location.reload()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    predictions,
    loading,
    error,
    generatePrediction,
    generateBatchPredictions,
  }
}

export function usePredictionForMatch(matchId: string) {
  const { predictions, loading, error } = usePredictions(matchId)

  const latestPrediction = predictions.length > 0 ? predictions[0] : null

  return {
    prediction: latestPrediction,
    loading,
    error,
  }
}
