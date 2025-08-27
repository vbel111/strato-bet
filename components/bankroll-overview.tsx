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

  const balancePercentage = ((bankroll.balance || 1000) / 1000) * 100

  return (
    <div className="grid md:grid-cols-4 gap-6">
      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Current Balance</CardDescription>
          <CardTitle className="text-2xl font-heading">${(Number(bankroll.balance) || 0).toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-2">
            <Progress value={Math.min(100, balancePercentage)} className="flex-1" />
            <span className={`text-sm font-medium ${(balancePercentage || 100) >= 100 ? "text-green-600" : "text-red-600"}`}>
              {(balancePercentage || 100) >= 100 ? "+" : ""}
              {((Number(balancePercentage) || 100) - 100).toFixed(1)}%
            </span>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Simulation Balance</CardDescription>
          <CardTitle className="text-2xl font-heading">${(Number(bankroll.simulation_balance) || 0).toFixed(2)}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-body">Practice trading</p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Win Rate</CardDescription>
          <CardTitle className="text-2xl font-heading">{(Number(stats.win_rate) || 0).toFixed(1)}%</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground font-body">
            {stats.winning_bets || 0}W / {stats.losing_bets || 0}L
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-2">
          <CardDescription className="font-body">Profit/Loss</CardDescription>
          <CardTitle
            className={`text-2xl font-heading ${(stats.profit_loss || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
          >
            {(Number(stats.profit_loss) || 0) >= 0 ? "+" : ""}${(Number(stats.profit_loss) || 0).toFixed(2)}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className={`text-sm font-medium ${(stats.roi || 0) >= 0 ? "text-green-600" : "text-red-600"}`}>
            ROI: {(Number(stats.roi) || 0).toFixed(1)}%
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
