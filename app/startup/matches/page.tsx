"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Users, Calendar, MessageSquare, TrendingUp, RefreshCw, AlertCircle } from "lucide-react"
import { MatchCard } from "@/components/matches/match-card"
import type { Database } from "@/types/database"

type Match = Database["public"]["Tables"]["matches"]["Row"] & {
  investors: Database["public"]["Tables"]["investors"]["Row"] & {
    users: Database["public"]["Tables"]["users"]["Row"]
  }
}

export default function StartupMatchesPage() {
  const { toast } = useToast()
  const [matches, setMatches] = useState<Match[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMatches = async () => {
    try {
      setLoading(true)
      setError(null)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        setError("User not authenticated")
        return
      }

      // First get the startup profile
      const { data: startup, error: startupError } = await supabase
        .from("startups")
        .select("id")
        .eq("user_id", session.user.id)
        .single()

      if (startupError || !startup) {
        setError("Startup profile not found")
        return
      }

      // Fetch matches with investor details
      const { data: matchesData, error: matchesError } = await supabase
        .from("matches")
        .select(`
          *,
          investors!inner(
            *,
            users!inner(*)
          )
        `)
        .eq("startup_id", startup.id)
        .order("created_at", { ascending: false })

      if (matchesError) {
        console.error("Error fetching matches:", matchesError)
        setError("Failed to load matches")
        return
      }

      setMatches(matchesData || [])
    } catch (err: any) {
      console.error("Error in fetchMatches:", err)
      setError(err.message || "An unexpected error occurred")
    } finally {
      setLoading(false)
    }
  }

  const generateMatches = async () => {
    try {
      setGenerating(true)

      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to generate matches",
          variant: "destructive",
        })
        return
      }

      console.log("Generating matches with session:", session.access_token ? "Token present" : "No token")

      const response = await fetch("/api/matches/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
      })

      console.log("Response status:", response.status)

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        console.error("API Error:", errorData)
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      console.log("API Result:", result)

      toast({
        title: "Matches Generated",
        description: result.message || "New matches have been generated",
      })

      // Refresh matches
      await fetchMatches()
    } catch (err: any) {
      console.error("Error generating matches:", err)
      toast({
        title: "Error Generating Matches",
        description: err.message || "Failed to generate matches",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const updateMatchStatus = async (matchId: string, status: string) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session?.user) {
        toast({
          title: "Authentication Error",
          description: "Please log in to update match status",
          variant: "destructive",
        })
        return
      }

      const response = await fetch(`/api/matches/${matchId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        credentials: "include",
        body: JSON.stringify({ status }),
      })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      toast({
        title: "Match Updated",
        description: `Match status updated to ${status}`,
      })

      // Refresh matches
      await fetchMatches()
    } catch (err: any) {
      console.error("Error updating match status:", err)
      toast({
        title: "Error Updating Match",
        description: err.message || "Failed to update match status",
        variant: "destructive",
      })
    }
  }

  useEffect(() => {
    fetchMatches()
  }, [])

  const getMatchesByStatus = (status: string) => {
    return matches.filter((match) => match.status === status)
  }

  if (loading) {
    return (
      <div className="w-full max-w-6xl mx-auto py-6 sm:py-8 lg:py-10">
        <div className="flex items-center justify-center h-48 sm:h-60">
          <Loader2 className="h-8 w-8 sm:h-12 sm:w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="w-full max-w-6xl mx-auto py-6 sm:py-8 lg:py-10">
        <Card>
          <CardContent className="p-4 sm:p-6 text-center">
            <AlertCircle className="h-8 w-8 sm:h-12 sm:w-12 text-destructive mx-auto mb-4" />
            <p className="text-destructive mb-4 text-sm sm:text-base">{error}</p>
            <Button onClick={fetchMatches} size="sm">Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div className="space-y-1 sm:space-y-2">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">Your Matches</h1>
          <p className="text-sm sm:text-base text-muted-foreground">Connect with investors that match your startup profile</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <Button onClick={fetchMatches} variant="outline" size="sm" className="w-full sm:w-auto">
            <RefreshCw className="h-4 w-4 mr-2" />
            <span className="sm:hidden">Refresh</span>
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <Button onClick={generateMatches} disabled={generating} size="sm" className="w-full sm:w-auto">
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                <span className="sm:hidden">Generating...</span>
                <span className="hidden sm:inline">Generating...</span>
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                <span className="sm:hidden">Generate</span>
                <span className="hidden sm:inline">Generate Matches</span>
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Matches</CardTitle>
            <Users className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{matches.length}</div>
            <p className="text-xs text-muted-foreground mt-1">Total connections</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Pending</CardTitle>
            <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-amber-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{getMatchesByStatus("pending").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting response</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Interested</CardTitle>
            <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{getMatchesByStatus("interested").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Mutual interest</p>
          </CardContent>
        </Card>
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-4 pt-3 sm:pt-4">
            <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Connected</CardTitle>
            <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4 text-blue-500" />
          </CardHeader>
          <CardContent className="px-3 sm:px-4 pb-3 sm:pb-4">
            <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{getMatchesByStatus("connected").length}</div>
            <p className="text-xs text-muted-foreground mt-1">Active conversations</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs Section */}
      <Tabs defaultValue="all" className="space-y-4 sm:space-y-6">
        <div className="overflow-x-auto scrollbar-hide">
          <TabsList className="inline-flex w-full min-w-fit h-auto p-1 gap-1">
            <TabsTrigger value="all" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto">
              <span className="hidden sm:inline">All Matches ({matches.length})</span>
              <span className="sm:hidden">All ({matches.length})</span>
            </TabsTrigger>
            <TabsTrigger value="pending" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto">
              <span className="hidden sm:inline">Pending ({getMatchesByStatus("pending").length})</span>
              <span className="sm:hidden">Pending ({getMatchesByStatus("pending").length})</span>
            </TabsTrigger>
            <TabsTrigger value="interested" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto">
              <span className="hidden sm:inline">Interested ({getMatchesByStatus("interested").length})</span>
              <span className="sm:hidden">Interest ({getMatchesByStatus("interested").length})</span>
            </TabsTrigger>
            <TabsTrigger value="connected" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto">
              <span className="hidden sm:inline">Connected ({getMatchesByStatus("connected").length})</span>
              <span className="sm:hidden">Connected ({getMatchesByStatus("connected").length})</span>
            </TabsTrigger>
            <TabsTrigger value="rejected" className="flex-shrink-0 text-xs sm:text-sm px-3 sm:px-4 py-2 h-auto">
              <span className="hidden sm:inline">Rejected ({getMatchesByStatus("rejected").length})</span>
              <span className="sm:hidden">Rejected ({getMatchesByStatus("rejected").length})</span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {matches.length === 0 && (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-4 text-sm sm:text-base">No matches found</p>
                <Button onClick={generateMatches} disabled={generating} className="w-full sm:w-auto">
                  {generating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    "Generate Your First Matches"
                  )}
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="pending">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {getMatchesByStatus("pending").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("pending").length === 0 && (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Calendar className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No pending matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interested">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {getMatchesByStatus("interested").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("interested").length === 0 && (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <TrendingUp className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No interested matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {getMatchesByStatus("connected").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("connected").length === 0 && (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <MessageSquare className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground mb-2 text-sm sm:text-base">No connected matches</p>
                <p className="text-xs sm:text-sm text-muted-foreground">
                  Express interest in pending matches to start conversations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
            {getMatchesByStatus("rejected").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("rejected").length === 0 && (
            <Card>
              <CardContent className="p-6 sm:p-8 text-center">
                <Users className="h-12 w-12 sm:h-16 sm:w-16 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground text-sm sm:text-base">No rejected matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
