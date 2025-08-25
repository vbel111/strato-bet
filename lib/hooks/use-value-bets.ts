"use client"

import { useState, useEffect } from "react"
import type { ValueBetOpportunity } from "@/lib/services/value-bet-calculator"

export function useValueBets(limit = 20) {
  const [valueBets, setValueBets] = useState<ValueBetOpportunity[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchValueBets() {
      try {
        const response = await fetch(`/api/value-bets?limit=${limit}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch value bets")
        }

        setValueBets(data.value_bets)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchValueBets()
  }, [limit])

  const calculateValueBets = async () => {
    try {
      setLoading(true)
      const response = await fetch("/api/value-bets/calculate", {
        method: "POST",
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to calculate value bets")
      }

      // Refresh value bets
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
    valueBets,
    loading,
    error,
    calculateValueBets,
  }
}

export function useOddsComparison(matchId: string) {
  const [comparison, setComparison] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchComparison() {
      try {
        const response = await fetch(`/api/odds-comparison/${matchId}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch odds comparison")
        }

        setComparison(data.comparison)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    if (matchId) {
      fetchComparison()
    }
  }, [matchId])

  return { comparison, loading, error }
}
