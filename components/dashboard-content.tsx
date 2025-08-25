"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ValueBetCard } from "@/components/value-bet-card"
import { BankrollOverview } from "@/components/bankroll-overview"
import { BettingHistory } from "@/components/betting-history"
import { useBankroll } from "@/lib/hooks/use-bankroll"
import { useValueBets } from "@/lib/hooks/use-value-bets"
import { useMatches } from "@/lib/hooks/use-sports-data"
import { usePredictions } from "@/lib/hooks/use-predictions"
import type { User } from "@supabase/supabase-js"

interface DashboardContentProps {
  user: User
}

export function DashboardContent({ user }: DashboardContentProps) {
  const [selectedSport, setSelectedSport] = useState("soccer_epl")
  const [currentPage, setCurrentPage] = useState(1)
  const [includeExternal, setIncludeExternal] = useState(true)

  const { bankroll, loading: bankrollLoading } = useBankroll()
  const { valueBets, loading: valueBetsLoading, calculateValueBets } = useValueBets(10)
  const {
    matches,
    loading: matchesLoading,
    syncMatches,
  } = useMatches({
    status: "scheduled",
    page: currentPage,
    pageSize: 20,
    sport: selectedSport,
    includeExternal,
  })
  const { predictions, generateBatchPredictions } = usePredictions()

  const [isCalculating, setIsCalculating] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)

  const sportCategories = [
    { value: "soccer_epl", label: "Premier League", type: "traditional" },
    { value: "soccer_uefa_champions_league", label: "Champions League", type: "traditional" },
    { value: "americanfootball_nfl", label: "NFL", type: "traditional" },
    { value: "basketball_nba", label: "NBA", type: "traditional" },
    { value: "lol", label: "League of Legends", type: "esports" },
    { value: "csgo", label: "CS:GO", type: "esports" },
    { value: "dota2", label: "Dota 2", type: "esports" },
    { value: "valorant", label: "Valorant", type: "esports" },
  ]

  const handleCalculateValueBets = async () => {
    setIsCalculating(true)
    try {
      await calculateValueBets()
    } catch (error) {
      console.error("Error calculating value bets:", error)
    } finally {
      setIsCalculating(false)
    }
  }

  const handleSyncData = async () => {
    setIsSyncing(true)
    try {
      await syncMatches()
      await generateBatchPredictions()
      await calculateValueBets()
    } catch (error) {
      console.error("Error syncing data:", error)
    } finally {
      setIsSyncing(false)
    }
  }

  const handleSportChange = (sport: string) => {
    setSelectedSport(sport)
    setCurrentPage(1)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold">Welcome back!</h1>
          <p className="text-muted-foreground font-body">
            Here's your betting dashboard with the latest value opportunities.
          </p>
        </div>
        <div className="flex items-center space-x-4">
          <Select value={selectedSport} onValueChange={handleSportChange}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Select sport" />
            </SelectTrigger>
            <SelectContent>
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground">Traditional Sports</div>
              {sportCategories
                .filter((sport) => sport.type === "traditional")
                .map((sport) => (
                  <SelectItem key={sport.value} value={sport.value}>
                    {sport.label}
                  </SelectItem>
                ))}
              <div className="px-2 py-1 text-xs font-semibold text-muted-foreground border-t mt-1 pt-2">Esports</div>
              {sportCategories
                .filter((sport) => sport.type === "esports")
                .map((sport) => (
                  <SelectItem key={sport.value} value={sport.value}>
                    {sport.label}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Button
            onClick={() => setIncludeExternal(!includeExternal)}
            variant={includeExternal ? "default" : "outline"}
            size="sm"
            className="font-body"
          >
            {includeExternal ? "Live Data" : "Database Only"}
          </Button>

          <Button
            onClick={handleCalculateValueBets}
            disabled={isCalculating}
            variant="outline"
            className="font-body bg-transparent"
          >
            {isCalculating ? "Calculating..." : "Refresh Value Bets"}
          </Button>
          <Button onClick={handleSyncData} disabled={isSyncing} className="font-body">
            {isSyncing ? "Syncing..." : "Sync All Data"}
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview" className="font-body">
            Overview
          </TabsTrigger>
          <TabsTrigger value="value-bets" className="font-body">
            Value Bets
          </TabsTrigger>
          <TabsTrigger value="matches" className="font-body">
            Matches
          </TabsTrigger>
          <TabsTrigger value="history" className="font-body">
            History
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <BankrollOverview />

          <div className="grid md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Today's Top Value Bets</CardTitle>
                <CardDescription className="font-body">Best opportunities based on our ML predictions</CardDescription>
              </CardHeader>
              <CardContent>
                {valueBetsLoading ? (
                  <p className="text-muted-foreground font-body">Loading value bets...</p>
                ) : valueBets.length > 0 ? (
                  <div className="space-y-4">
                    {valueBets.slice(0, 3).map((bet) => (
                      <div key={bet.id} className="p-4 border rounded-lg">
                        <div className="flex items-center justify-between mb-2">
                          <p className="font-medium font-body">
                            {bet.match_info.home_team} vs {bet.match_info.away_team}
                          </p>
                          <Badge className="bg-green-100 text-green-800 border-0">
                            +{bet.value_percentage.toFixed(1)}%
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground font-body">
                          {bet.bookmaker_name} @ {bet.bookmaker_odds.toFixed(2)}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground font-body">No value bets available</p>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="font-heading">Upcoming Matches</CardTitle>
                <CardDescription className="font-body">
                  Next {sportCategories.find((s) => s.value === selectedSport)?.label} matches
                </CardDescription>
              </CardHeader>
              <CardContent>
                {matchesLoading ? (
                  <p className="text-muted-foreground font-body">Loading matches...</p>
                ) : matches.length > 0 ? (
                  <div className="space-y-4">
                    {matches.slice(0, 3).map((match) => (
                      <div key={match.id} className="p-4 border rounded-lg">
                        <p className="font-medium font-body">
                          {match.home_team?.name || match.home_team} vs {match.away_team?.name || match.away_team}
                        </p>
                        <p className="text-sm text-muted-foreground font-body">
                          {match.league?.name || match.sport_title} •{" "}
                          {new Date(match.match_date || match.commence_time).toLocaleDateString()}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground font-body">No upcoming matches</p>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="value-bets" className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-heading font-bold">Value Betting Opportunities</h2>
              <p className="text-muted-foreground font-body">
                Bets where our predictions suggest better odds than bookmakers offer
              </p>
            </div>
          </div>

          {valueBetsLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4"></div>
                    <div className="h-3 bg-muted rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="h-3 bg-muted rounded"></div>
                      <div className="h-3 bg-muted rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : valueBets.length > 0 ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {valueBets.map((bet) => (
                <ValueBetCard key={bet.id} valueBet={bet} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="text-center py-12">
                <p className="text-muted-foreground font-body mb-4">No value bets available at the moment</p>
                <Button onClick={handleCalculateValueBets} disabled={isCalculating}>
                  {isCalculating ? "Calculating..." : "Calculate Value Bets"}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle className="font-heading">
                Upcoming {sportCategories.find((s) => s.value === selectedSport)?.label} Matches
              </CardTitle>
              <CardDescription className="font-body">
                All scheduled matches with predictions and odds • {includeExternal ? "Live data" : "Database only"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {matchesLoading ? (
                <p className="text-muted-foreground font-body">Loading matches...</p>
              ) : (
                <div className="space-y-4">
                  {matches.map((match) => (
                    <div key={match.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium font-body">
                            {match.home_team?.name || match.home_team} vs {match.away_team?.name || match.away_team}
                          </p>
                          <p className="text-sm text-muted-foreground font-body">
                            {match.league?.name || match.sport_title} •{" "}
                            {new Date(match.match_date || match.commence_time).toLocaleDateString()} at{" "}
                            {new Date(match.match_date || match.commence_time).toLocaleTimeString([], {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        </div>
                        <div className="flex items-center space-x-2">
                          {sportCategories.find((s) => s.value === selectedSport)?.type === "esports" && (
                            <Badge variant="secondary" className="text-xs">
                              Esports
                            </Badge>
                          )}
                          <Badge variant="outline" className="font-body">
                            {match.status || "scheduled"}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}

                  {matches.length === 20 && (
                    <div className="flex justify-center space-x-2 pt-4">
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                      >
                        Previous
                      </Button>
                      <span className="flex items-center px-4 text-sm text-muted-foreground">Page {currentPage}</span>
                      <Button
                        variant="outline"
                        onClick={() => setCurrentPage(currentPage + 1)}
                        disabled={matches.length < 20}
                      >
                        Next
                      </Button>
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="history">
          <BettingHistory />
        </TabsContent>
      </Tabs>
    </div>
  )
}
