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
    const stats = await bankrollManager.getBankrollStats(user.id)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching bankroll stats:", error)
    return NextResponse.json({ error: "Failed to fetch bankroll stats" }, { status: 500 })
  }
}
