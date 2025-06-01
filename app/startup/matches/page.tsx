"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { useToast } from "@/components/ui/use-toast"
import { Loader2, Users, Calendar, MessageSquare, TrendingUp, RefreshCw } from "lucide-react"
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
      <div className="container mx-auto py-10">
        <div className="flex items-center justify-center h-60">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardContent className="p-6 text-center">
            <p className="text-destructive mb-4">{error}</p>
            <Button onClick={fetchMatches}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Your Matches</h1>
          <p className="text-muted-foreground">Connect with investors that match your startup profile</p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchMatches} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button onClick={generateMatches} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <TrendingUp className="h-4 w-4 mr-2" />
                Generate Matches
              </>
            )}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Matches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{matches.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMatchesByStatus("pending").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interested</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMatchesByStatus("interested").length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Connected</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{getMatchesByStatus("connected").length}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="all" className="space-y-4">
        <TabsList>
          <TabsTrigger value="all">All Matches ({matches.length})</TabsTrigger>
          <TabsTrigger value="pending">Pending ({getMatchesByStatus("pending").length})</TabsTrigger>
          <TabsTrigger value="interested">Interested ({getMatchesByStatus("interested").length})</TabsTrigger>
          <TabsTrigger value="connected">Connected ({getMatchesByStatus("connected").length})</TabsTrigger>
          <TabsTrigger value="rejected">Rejected ({getMatchesByStatus("rejected").length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {matches.length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground mb-4">No matches found</p>
                <Button onClick={generateMatches} disabled={generating}>
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getMatchesByStatus("pending").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("pending").length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No pending matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="interested">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getMatchesByStatus("interested").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("interested").length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No interested matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="connected">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getMatchesByStatus("connected").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("connected").length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No connected matches</p>
                <p className="text-sm text-muted-foreground mt-2">
                  Express interest in pending matches to start conversations
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="rejected">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getMatchesByStatus("rejected").map((match) => (
              <MatchCard key={match.id} match={match} onStatusUpdate={updateMatchStatus} userType="startup" />
            ))}
          </div>
          {getMatchesByStatus("rejected").length === 0 && (
            <Card>
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No rejected matches</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
}
