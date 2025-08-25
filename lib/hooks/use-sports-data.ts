"use client"

import { useState, useEffect } from "react"
import type { Sport, League, Match } from "@/lib/types/sports"

export function useSports() {
  const [sports, setSports] = useState<Sport[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchSports() {
      try {
        const response = await fetch("/api/sports")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch sports")
        }

        setSports(data.sports)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchSports()
  }, [])

  return { sports, loading, error }
}

export function useLeagues(sportId?: string) {
  const [leagues, setLeagues] = useState<League[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchLeagues() {
      try {
        const url = sportId ? `/api/leagues?sport_id=${sportId}` : "/api/leagues"
        const response = await fetch(url)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch leagues")
        }

        setLeagues(data.leagues)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchLeagues()
  }, [sportId])

  return { leagues, loading, error }
}

export function useMatches(filters?: {
  leagueId?: string
  status?: string
  date?: string
  limit?: number
}) {
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchMatches() {
      try {
        const params = new URLSearchParams()
        if (filters?.leagueId) params.append("league_id", filters.leagueId)
        if (filters?.status) params.append("status", filters.status)
        if (filters?.date) params.append("date", filters.date)
        if (filters?.limit) params.append("limit", filters.limit.toString())

        const response = await fetch(`/api/matches?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch matches")
        }

        setMatches(data.matches)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchMatches()
  }, [filters?.leagueId, filters?.status, filters?.date, filters?.limit])

  const syncMatches = async (sport = "soccer_epl") => {
    try {
      setLoading(true)
      const response = await fetch("/api/matches/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sport }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to sync matches")
      }

      // Refresh matches after sync
      window.location.reload()

      return data
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { matches, loading, error, syncMatches }
}
