import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { formatProbability } from "@/lib/utils/prediction-helpers"

interface OddsComparisonProps {
  comparison: {
    match: {
      home_team: string
      away_team: string
      league: string
      match_date: string
    }
    prediction: {
      home_win_probability: number
      draw_probability?: number
      away_win_probability: number
      confidence_score: number
    }
    odds_comparison: Array<{
      bookmaker: string
      home_odds: number
      draw_odds?: number
      away_odds: number
      home_implied: number
      draw_implied?: number
      away_implied: number
      home_value: { hasValue: boolean; valuePercentage: number } | null
      draw_value: { hasValue: boolean; valuePercentage: number } | null
      away_value: { hasValue: boolean; valuePercentage: number } | null
    }>
  }
}

export function OddsComparisonTable({ comparison }: OddsComparisonProps) {
  const getValueBadge = (value: { hasValue: boolean; valuePercentage: number } | null) => {
    if (!value || !value.hasValue) return null

    const color =
      value.valuePercentage >= 10
        ? "bg-green-100 text-green-800"
        : value.valuePercentage >= 5
          ? "bg-yellow-100 text-yellow-800"
          : "bg-gray-100 text-gray-800"

    return <Badge className={`${color} border-0 text-xs`}>+{(value.valuePercentage || 0).toFixed(1)}%</Badge>
  }

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-heading font-bold">
          {comparison.match.home_team} vs {comparison.match.away_team}
        </h2>
        <p className="text-muted-foreground font-body">
          {comparison.match.league} • {new Date(comparison.match.match_date).toLocaleDateString()}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
        <div className="text-center">
          <p className="font-medium font-body">{comparison.match.home_team}</p>
          <p className="text-2xl font-bold text-primary">
            {formatProbability(comparison.prediction.home_win_probability)}
          </p>
          <p className="text-xs text-muted-foreground font-body">Our Prediction</p>
        </div>

        {comparison.prediction.draw_probability && (
          <div className="text-center">
            <p className="font-medium font-body">Draw</p>
            <p className="text-2xl font-bold text-secondary">
              {formatProbability(comparison.prediction.draw_probability)}
            </p>
            <p className="text-xs text-muted-foreground font-body">Our Prediction</p>
          </div>
        )}

        <div className="text-center">
          <p className="font-medium font-body">{comparison.match.away_team}</p>
          <p className="text-2xl font-bold text-primary">
            {formatProbability(comparison.prediction.away_win_probability)}
          </p>
          <p className="text-xs text-muted-foreground font-body">Our Prediction</p>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="font-body">Bookmaker</TableHead>
            <TableHead className="text-center font-body">{comparison.match.home_team}</TableHead>
            {comparison.prediction.draw_probability && <TableHead className="text-center font-body">Draw</TableHead>}
            <TableHead className="text-center font-body">{comparison.match.away_team}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {comparison.odds_comparison.map((odds, index) => (
            <TableRow key={index}>
              <TableCell className="font-medium font-body">{odds.bookmaker}</TableCell>

              <TableCell className="text-center">
                <div className="space-y-1">
                  <p className="font-medium">{(odds.home_odds || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{formatProbability(odds.home_implied)}</p>
                  {getValueBadge(odds.home_value)}
                </div>
              </TableCell>

              {comparison.prediction.draw_probability && (
                <TableCell className="text-center">
                  <div className="space-y-1">
                    <p className="font-medium">{odds.draw_odds ? (odds.draw_odds || 0).toFixed(2) : "-"}</p>
                    <p className="text-xs text-muted-foreground">
                      {odds.draw_implied ? formatProbability(odds.draw_implied) : "-"}
                    </p>
                    {getValueBadge(odds.draw_value)}
                  </div>
                </TableCell>
              )}

              <TableCell className="text-center">
                <div className="space-y-1">
                  <p className="font-medium">{(odds.away_odds || 0).toFixed(2)}</p>
                  <p className="text-xs text-muted-foreground">{formatProbability(odds.away_implied)}</p>
                  {getValueBadge(odds.away_value)}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
