"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useBets } from "@/lib/hooks/use-bankroll"

export function BettingHistory() {
  const { bets, loading } = useBets({ limit: 20 })

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Betting History</CardTitle>
          <CardDescription className="font-body">Loading your recent bets...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 bg-muted rounded"></div>
            ))}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "won":
        return "bg-green-100 text-green-800"
      case "lost":
        return "bg-red-100 text-red-800"
      case "pending":
        return "bg-yellow-100 text-yellow-800"
      case "void":
        return "bg-gray-100 text-gray-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading">Betting History</CardTitle>
        <CardDescription className="font-body">Your recent betting activity and results</CardDescription>
      </CardHeader>
      <CardContent>
        {bets.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="font-body">Match</TableHead>
                <TableHead className="font-body">Bet</TableHead>
                <TableHead className="font-body">Stake</TableHead>
                <TableHead className="font-body">Odds</TableHead>
                <TableHead className="font-body">Status</TableHead>
                <TableHead className="font-body">Payout</TableHead>
                <TableHead className="font-body">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bets.map((bet) => (
                <TableRow key={bet.id}>
                  <TableCell className="font-body">
                    <div>
                      <p className="font-medium">
                        {bet.match_info?.home_team} vs {bet.match_info?.away_team}
                      </p>
                      <p className="text-xs text-muted-foreground">{bet.match_info?.league}</p>
                    </div>
                  </TableCell>
                  <TableCell className="font-body">
                    <Badge variant="outline" className="capitalize">
                      {bet.bet_type === "home"
                        ? bet.match_info?.home_team
                        : bet.bet_type === "away"
                          ? bet.match_info?.away_team
                          : "Draw"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-body">${bet.stake_amount.toFixed(2)}</TableCell>
                  <TableCell className="font-body">{bet.odds.toFixed(2)}</TableCell>
                  <TableCell>
                    <Badge className={`${getStatusColor(bet.status)} border-0 capitalize`}>{bet.status}</Badge>
                  </TableCell>
                  <TableCell className="font-body">
                    {bet.status === "pending" ? (
                      <span className="text-muted-foreground">${bet.potential_payout.toFixed(2)}</span>
                    ) : (
                      <span className={bet.actual_payout > 0 ? "text-green-600" : "text-red-600"}>
                        ${bet.actual_payout.toFixed(2)}
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="font-body text-sm text-muted-foreground">
                    {new Date(bet.placed_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center py-12">
            <p className="text-muted-foreground font-body">No betting history yet</p>
            <p className="text-sm text-muted-foreground font-body mt-2">
              Start by placing your first bet on a value opportunity
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
