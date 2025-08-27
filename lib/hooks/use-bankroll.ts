"use client"

import { useState, useEffect } from "react"

// Define the types here since bankroll-manager was removed
interface BankrollData {
  id: string
  user_id: string
  balance: number
  simulation_balance: number
  created_at: string
  updated_at: string
}

interface BankrollStats {
  total_bets: number
  winning_bets: number
  losing_bets: number
  win_rate: number
  profit_loss: number
  roi: number
  balance: number
  simulation_balance: number
}

interface BetRecord {
  id: string
  user_id: string
  match_id: string
  bet_type: string
  amount: number
  odds: number
  potential_payout: number
  actual_payout?: number
  status: 'pending' | 'won' | 'lost' | 'cancelled'
  is_simulation: boolean
  created_at: string
  updated_at: string
}

export function useBankroll() {
  const [bankroll, setBankroll] = useState<BankrollData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBankroll() {
      try {
        const response = await fetch("/api/bankroll")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bankroll")
        }

        setBankroll(data.bankroll)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchBankroll()
  }, [])

  const initializeBankroll = async (initialBalance: number) => {
    try {
      setLoading(true)
      const response = await fetch("/api/bankroll", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ initialBalance }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to initialize bankroll")
      }

      setBankroll(data.bankroll)
      return data.bankroll
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { bankroll, loading, error, initializeBankroll }
}

export function useBets(filters?: { status?: string; simulation?: boolean; limit?: number }) {
  const [bets, setBets] = useState<BetRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchBets() {
      try {
        const params = new URLSearchParams()
        if (filters?.status) params.append("status", filters.status)
        if (filters?.simulation !== undefined) params.append("simulation", filters.simulation.toString())
        if (filters?.limit) params.append("limit", filters.limit.toString())

        const response = await fetch(`/api/bets?${params}`)
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch bets")
        }

        setBets(data.bets)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchBets()
  }, [filters?.status, filters?.simulation, filters?.limit])

  const placeBet = async (betData: any) => {
    try {
      setLoading(true)
      const response = await fetch("/api/bets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(betData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || "Failed to place bet")
      }

      // Refresh bets
      window.location.reload()

      return data.bet
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return { bets, loading, error, placeBet }
}

export function useBankrollStats() {
  const [stats, setStats] = useState<BankrollStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchStats() {
      try {
        const response = await fetch("/api/bankroll/stats")
        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.error || "Failed to fetch stats")
        }

        setStats(data.stats)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return { stats, loading, error }
}
