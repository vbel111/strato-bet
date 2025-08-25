"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { useBankroll, useBankrollStats } from "@/lib/hooks/use-bankroll"

export function BankrollOverview() {
  const { bankroll, loading: bankrollLoading } = useBankroll()
  const { stats, loading: statsLoading } = useBankrollStats()

  if (bankrollLoading || statsLoading) {
    return (
      <div className="grid md:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-muted rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (!bankroll || !stats) {
    return (
      <Card>
        <CardContent className="text-center py-12">
          <p className="text-muted-foreground font-body">No bankroll data available</p>
        </CardContent>
      </Card>
    )
  }

  const balancePercentage = (bankroll.current_balance / bankroll.initial_balance) * 100

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Current Balance</CardDescription>
          <CardTitle className="text-2xl font-heading">${bankroll.current_balance.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Progress value={Math.min(100, balancePercentage)} className="flex-1" />
            <span className={`text-sm font-medium ${balancePercentage >= 100 ? "text-green-600" : "text-red-600"}`}>
              {balancePercentage >= 100 ? "+" : ""}
              {(balancePercentage - 100).toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Total Wagered</CardDescription>
          <CardTitle className="text-2xl font-heading">${bankroll.total_wagered.toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-body">Across {stats.total_bets} bets</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Win Rate</CardDescription>
          <CardTitle className="text-2xl font-heading">{stats.win_rate.toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-body">
            {stats.winning_bets}W / {stats.losing_bets}L
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">ROI</CardDescription>
          <CardTitle
            className={`text-2xl font-heading ${bankroll.roi_percentage >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {bankroll.roi_percentage >= 0 ? "+" : ""}
            {bankroll.roi_percentage.toFixed(1)}%
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-sm font-medium ${stats.profit_loss >= 0 ? "text-green-600" : "text-red-600"}`}>
            {stats.profit_loss >= 0 ? "+" : ""}${stats.profit_loss.toFixed(2)}
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
