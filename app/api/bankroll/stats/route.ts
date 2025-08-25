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

    // Check if user has a bankroll record, create if not
    const { data: bankroll } = await supabase
      .from('user_bankrolls')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (!bankroll) {
      // Create bankroll for new user
      await supabase
        .from('user_bankrolls')
        .insert({ user_id: user.id })
    }

    const bankrollManager = BankrollManager.getInstance()
    const stats = await bankrollManager.getBankrollStats(user.id)

    return NextResponse.json({ stats })
  } catch (error) {
    console.error("Error fetching bankroll stats:", error)
    return NextResponse.json({ 
      error: "Failed to fetch bankroll stats",
      details: error instanceof Error ? error.message : String(error)
    }, { status: 500 })
  }
}
