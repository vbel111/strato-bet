"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import type { ValueBetOpportunity } from "@/lib/services/value-bet-calculator"
import { formatProbability, getConfidenceLevel, getConfidenceColor } from "@/lib/utils/prediction-helpers"

interface ValueBetCardProps {
  valueBet: ValueBetOpportunity
  onPlaceBet?: (valueBet: ValueBetOpportunity) => void
}

export function ValueBetCard({ valueBet, onPlaceBet }: ValueBetCardProps) {
  const getBetTypeLabel = (type: string) => {
    switch (type) {
      case "home":
        return valueBet.match_info.home_team
      case "away":
        return valueBet.match_info.away_team
      case "draw":
        return "Draw"
      default:
        return type
    }
  }

  const getValueColor = (percentage: number) => {
    if (percentage >= 20) return "text-green-600 bg-green-50"
    if (percentage >= 10) return "text-green-500 bg-green-50"
    if (percentage >= 5) return "text-yellow-600 bg-yellow-50"
    return "text-gray-600 bg-gray-50"
  }

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-heading">
            {valueBet.match_info.home_team} vs {valueBet.match_info.away_team}
          </CardTitle>
          <Badge variant="outline" className="font-body text-xs">
            {valueBet.match_info.league}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          {new Date(valueBet.match_info.match_date).toLocaleDateString()} at{" "}
          {new Date(valueBet.match_info.match_date).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </p>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-medium font-body">Bet: {getBetTypeLabel(valueBet.bet_type)}</p>
            <p className="text-sm text-muted-foreground font-body">
              {valueBet.bookmaker_name} @ {(Number(valueBet.bookmaker_odds) || 0).toFixed(2)}
            </p>
          </div>
          <div className="text-right">
            <Badge className={`${getValueColor(valueBet.value_percentage)} border-0`}>
              +{(Number(valueBet.value_percentage) || 0).toFixed(1)}% Value
            </Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm font-body">
          <div>
            <p className="text-muted-foreground">Our Prediction</p>
            <p className="font-medium">{formatProbability(valueBet.predicted_probability)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Implied Odds</p>
            <p className="font-medium">{formatProbability(valueBet.implied_probability)}</p>
          </div>
          <div>
            <p className="text-muted-foreground">Confidence</p>
            <p className={`font-medium ${getConfidenceColor(valueBet.confidence_score)}`}>
              {getConfidenceLevel(valueBet.confidence_score)}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground">Kelly %</p>
            <p className="font-medium">{(Number(valueBet.kelly_percentage) || 0).toFixed(1)}%</p>
          </div>
        </div>

        <div className="pt-2">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-body">Expected Value</span>
            <span className={`text-sm font-medium ${(valueBet.expected_value || 0) > 0 ? "text-green-600" : "text-red-600"}`}>
              {(valueBet.expected_value || 0) > 0 ? "+" : ""}
              {(Number(valueBet.expected_value) || 0).toFixed(3)}
            </span>
          </div>

          {onPlaceBet && (
            <Button onClick={() => onPlaceBet(valueBet)} className="w-full font-body font-medium" size="sm">
              Place Bet
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
