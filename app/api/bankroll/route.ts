import { BankrollManager } from "@/lib/services/bankroll-manager"
import { createClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const supabase = await createClient()
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const bankrollManager = BankrollManager.getInstance()
    const bankroll = await bankrollManager.getUserBankroll(user.id)

    if (!bankroll) {
      // Initialize bankroll if it doesn't exist
      const newBankroll = await bankrollManager.initializeBankroll(user.id)
      return NextResponse.json({ bankroll: newBankroll })
    }

    return NextResponse.json({ bankroll })
  } catch (error) {
    console.error("Error fetching bankroll:", error)
    return NextResponse.json({ error: "Failed to fetch bankroll" }, { status: 500 })
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

    const { initialBalance } = await request.json()

    if (!initialBalance || initialBalance <= 0) {
      return NextResponse.json({ error: "Invalid initial balance" }, { status: 400 })
    }

    const bankrollManager = BankrollManager.getInstance()
    const bankroll = await bankrollManager.initializeBankroll(user.id, initialBalance)

    return NextResponse.json({ bankroll })
  } catch (error) {
    console.error("Error initializing bankroll:", error)
    return NextResponse.json({ error: "Failed to initialize bankroll" }, { status: 500 })
  }
}
