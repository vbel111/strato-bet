export function formatProbability(probability: number): string {
  return `${(Number(probability) * 100 || 0).toFixed(1)}%`
}

export function getConfidenceLevel(score: number): string {
  if (score >= 0.8) return "Very High"
  if (score >= 0.6) return "High"
  if (score >= 0.4) return "Medium"
  if (score >= 0.2) return "Low"
  return "Very Low"
}

export function getConfidenceColor(score: number): string {
  if (score >= 0.8) return "text-green-600"
  if (score >= 0.6) return "text-green-500"
  if (score >= 0.4) return "text-yellow-500"
  if (score >= 0.2) return "text-orange-500"
  return "text-red-500"
}

export function getMostLikelyOutcome(prediction: {
  home_win_probability: number
  draw_probability?: number | null
  away_win_probability: number
}): "home" | "draw" | "away" {
  const { home_win_probability, draw_probability, away_win_probability } = prediction

  const drawProb = draw_probability || 0

  if (home_win_probability >= drawProb && home_win_probability >= away_win_probability) {
    return "home"
  }

  if (drawProb >= home_win_probability && drawProb >= away_win_probability) {
    return "draw"
  }

  return "away"
}

export function calculateImpliedOdds(probability: number): number {
  return 1 / probability
}

export function oddsToImpliedProbability(odds: number): number {
  return 1 / odds
}

export function calculateValueBet(
  predictedProbability: number,
  bookmakerOdds: number,
): { hasValue: boolean; valuePercentage: number } {
  const impliedProbability = oddsToImpliedProbability(bookmakerOdds)
  const valuePercentage = ((predictedProbability - impliedProbability) / impliedProbability) * 100

  return {
    hasValue: valuePercentage > 0,
    valuePercentage: Math.round(valuePercentage * 100) / 100,
  }
}
