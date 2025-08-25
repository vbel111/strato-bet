import { BankrollManager } from "@/lib/services/bankroll-manager"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const isSimulation = searchParams.get("simulation") === "true"
    const limit = Number.parseInt(searchParams.get("limit") || "50")

    const bankrollManager = BankrollManager.getInstance()
    const bets = await bankrollManager.getUserBets(user.id, {
      status: status || undefined,
      isSimulation,
      limit,
    })

    return NextResponse.json({ bets })
  } catch (error) {
    console.error("Error fetching bets:", error)
    return NextResponse.json({ 
      error: "Failed to fetch bets",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}

export async function POST(request: Request) {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const betData = await request.json()

    const bankrollManager = BankrollManager.getInstance()
    const bet = await bankrollManager.placeBet(user.id, betData)

    return NextResponse.json({ bet })
  } catch (error) {
    console.error("Error placing bet:", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed to place bet" }, { status: 500 })
  }
}
