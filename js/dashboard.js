// Mock match data
const mockMatches = [
  {
    id: 1,
    sport: "Football",
    homeTeam: "Manchester City",
    awayTeam: "Liverpool",
    time: "15:00",
    bookmakerOdds: { home: 2.1, draw: 3.4, away: 3.2 },
    modelPrediction: { home: 0.52, draw: 0.28, away: 0.2 },
    isValueBet: true,
    edge: 9.2,
  },
  {
    id: 2,
    sport: "Basketball",
    homeTeam: "Lakers",
    awayTeam: "Warriors",
    time: "20:30",
    bookmakerOdds: { home: 1.85, away: 1.95 },
    modelPrediction: { home: 0.48, away: 0.52 },
    isValueBet: false,
    edge: -2.1,
  },
  {
    id: 3,
    sport: "Tennis",
    homeTeam: "Djokovic",
    awayTeam: "Nadal",
    time: "14:00",
    bookmakerOdds: { home: 1.75, away: 2.05 },
    modelPrediction: { home: 0.65, away: 0.35 },
    isValueBet: true,
    edge: 13.8,
  },
  {
    id: 4,
    sport: "Esports",
    homeTeam: "Team Liquid",
    awayTeam: "FaZe Clan",
    time: "18:00",
    bookmakerOdds: { home: 2.2, away: 1.65 },
    modelPrediction: { home: 0.42, away: 0.58 },
    isValueBet: false,
    edge: -7.6,
  },
]

function renderMatches() {
  const matchesGrid = document.getElementById("matchesGrid")
  if (!matchesGrid) return

  matchesGrid.innerHTML = mockMatches
    .map((match) => {
      const valueBetBadge = match.isValueBet
        ? `<span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-accent text-accent-foreground">
                Value Bet +${match.edge}%
            </span>`
        : ""

      return `
            <div class="bg-card p-6 rounded-lg border border-border ${match.isValueBet ? "ring-2 ring-accent/20" : ""}">
                <div class="flex justify-between items-start mb-4">
                    <div>
                        <span class="text-sm text-muted-foreground">${match.sport} • ${match.time}</span>
                        <h3 class="text-lg font-semibold">${match.homeTeam} vs ${match.awayTeam}</h3>
                    </div>
                    ${valueBetBadge}
                </div>
                
                <div class="space-y-3">
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-muted-foreground">Bookmaker Odds</span>
                        <div class="flex gap-2">
                            ${match.bookmakerOdds.home ? `<span class="px-2 py-1 bg-muted rounded text-sm">${match.bookmakerOdds.home}</span>` : ""}
                            ${match.bookmakerOdds.draw ? `<span class="px-2 py-1 bg-muted rounded text-sm">${match.bookmakerOdds.draw}</span>` : ""}
                            ${match.bookmakerOdds.away ? `<span class="px-2 py-1 bg-muted rounded text-sm">${match.bookmakerOdds.away}</span>` : ""}
                        </div>
                    </div>
                    
                    <div class="flex justify-between items-center">
                        <span class="text-sm text-muted-foreground">Model Prediction</span>
                        <div class="flex gap-2">
                            ${match.modelPrediction.home ? `<span class="px-2 py-1 bg-primary/10 text-primary rounded text-sm">${(match.modelPrediction.home * 100).toFixed(1)}%</span>` : ""}
                            ${match.modelPrediction.draw ? `<span class="px-2 py-1 bg-primary/10 text-primary rounded text-sm">${(match.modelPrediction.draw * 100).toFixed(1)}%</span>` : ""}
                            ${match.modelPrediction.away ? `<span class="px-2 py-1 bg-primary/10 text-primary rounded text-sm">${(match.modelPrediction.away * 100).toFixed(1)}%</span>` : ""}
                        </div>
                    </div>
                </div>
                
                <div class="mt-4 pt-4 border-t border-border">
                    <div class="flex justify-between items-center">
                        <span class="text-sm ${match.edge > 0 ? "text-accent" : "text-muted-foreground"}">
                            Edge: ${match.edge > 0 ? "+" : ""}${match.edge}%
                        </span>
                        <button class="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm">
                            View Details
                        </button>
                    </div>
                </div>
            </div>
        `
    })
    .join("")
}

function runSimulation() {
  const bankroll = Number.parseFloat(document.getElementById("bankroll").value)
  const betSizePercent = Number.parseFloat(document.getElementById("betSize").value)
  const numBets = Number.parseInt(document.getElementById("numBets").value)

  let currentBankroll = bankroll
  const betSize = bankroll * (betSizePercent / 100)

  // Simulate bets with 55% win rate and average odds of 2.0
  for (let i = 0; i < numBets; i++) {
    const isWin = Math.random() < 0.55
    if (isWin) {
      currentBankroll += betSize * 0.9 // 90% return (1.9 odds)
    } else {
      currentBankroll -= betSize
    }
  }

  const totalPL = currentBankroll - bankroll
  const roi = (totalPL / bankroll) * 100

  // Display results
  document.getElementById("finalBankroll").textContent = `$${currentBankroll.toFixed(2)}`
  document.getElementById("totalPL").textContent = `$${totalPL.toFixed(2)}`
  document.getElementById("totalPL").className =
    `text-xl font-bold ${totalPL >= 0 ? "text-accent" : "text-destructive"}`
  document.getElementById("roi").textContent = `${roi.toFixed(1)}%`
  document.getElementById("roi").className = `text-xl font-bold ${roi >= 0 ? "text-accent" : "text-destructive"}`

  document.getElementById("simulationResults").classList.remove("hidden")
}

// Initialize dashboard
document.addEventListener("DOMContentLoaded", () => {
  renderMatches()
})
