"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MatchCard } from "@/components/matches/match-card"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { Loader2, RefreshCw, Building2, TrendingUp } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"

export default function InvestorMatchesPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [investorProfile, setInvestorProfile] = useState<any>(null)
  const [matches, setMatches] = useState<any[]>([])
  const [filteredMatches, setFilteredMatches] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("all")

  useEffect(() => {
    if (user) {
      loadInvestorProfile()
    }
  }, [user])

  useEffect(() => {
    if (investorProfile) {
      loadMatches()
    }
  }, [investorProfile])

  useEffect(() => {
    filterMatches(activeTab)
  }, [matches, activeTab])

  const loadInvestorProfile = async () => {
    try {
      const { data } = await supabase.from("investors").select("*").eq("user_id", user!.id).single()
      setInvestorProfile(data)
    } catch (error) {
      console.error("Error loading investor profile:", error)
    }
  }

  const loadMatches = async () => {
    try {
      const { data } = await supabase
        .from("matches")
        .select(`
          *,
          startups (
            id,
            slug,
            company_name,
            tagline,
            logo,
            stage,
            industry,
            business_model,
            target_amount,
            total_raised,
            valuation,
            is_verified,
            users (
              first_name,
              last_name,
              profile_picture
            )
          )
        `)
        .eq("investor_id", investorProfile.id)
        .order("created_at", { ascending: false })

      if (data) {
        setMatches(data)
      }
    } catch (error) {
      console.error("Error loading matches:", error)
    } finally {
      setLoading(false)
    }
  }

  const filterMatches = (status: string) => {
    if (status === "all") {
      setFilteredMatches(matches)
    } else {
      setFilteredMatches(matches.filter((match) => match.status === status))
    }
  }

  const generateMatches = async () => {
    setGenerating(true)
    try {
      const response = await fetch("/api/matches/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userType: "investor",
          userId: investorProfile.id,
        }),
      })

      const result = await response.json()

      if (result.success) {
        toast({
          title: "Matches Generated",
          description: `Found ${result.totalGenerated} new potential matches!`,
        })
        loadMatches()
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error generating matches:", error)
      toast({
        title: "Error",
        description: "Failed to generate matches. Please try again.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  const updateMatchStatus = async (matchId: string, status: string) => {
    try {
      const response = await fetch(`/api/matches/${matchId}/status`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      })

      const result = await response.json()

      if (result.success) {
        // Update local state
        setMatches(matches.map((match) => (match.id === matchId ? { ...match, status } : match)))

        toast({
          title: "Status Updated",
          description: `Match status updated to ${status}`,
        })
      } else {
        throw new Error(result.error)
      }
    } catch (error) {
      console.error("Error updating match status:", error)
      toast({
        title: "Error",
        description: "Failed to update match status",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <>
        <div className="flex items-center justify-center h-full">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </>
    )
  }

  if (!investorProfile) {
    return (
      <>
        <Card>
          <CardHeader>
            <CardTitle>Complete Your Profile</CardTitle>
            <CardDescription>You need to complete your investor profile to see startup matches</CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/investor/profile">Complete Profile</a>
            </Button>
          </CardContent>
        </Card>
      </>
    )
  }

  return (
    <>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Startup Matches</h1>
            <p className="text-muted-foreground">Discover startups that match your investment criteria</p>
          </div>
          <Button onClick={generateMatches} disabled={generating}>
            {generating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
            {generating ? "Generating..." : "Find New Matches"}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Matches</p>
                  <p className="text-2xl font-bold">{matches.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Interested</p>
                  <p className="text-2xl font-bold">{matches.filter((m) => m.status === "interested").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center">
                <Building2 className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Meetings</p>
                  <p className="text-2xl font-bold">{matches.filter((m) => m.status === "meeting-scheduled").length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Matches */}
        <Tabs defaultValue="all" onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-5 w-full md:w-auto">
            <TabsTrigger value="all">All ({matches.length})</TabsTrigger>
            <TabsTrigger value="pending">Pending ({matches.filter((m) => m.status === "pending").length})</TabsTrigger>
            <TabsTrigger value="interested">
              Interested ({matches.filter((m) => m.status === "interested").length})
            </TabsTrigger>
            <TabsTrigger value="meeting-scheduled">
              Meetings ({matches.filter((m) => m.status === "meeting-scheduled").length})
            </TabsTrigger>
            <TabsTrigger value="not-interested">
              Passed ({matches.filter((m) => m.status === "not-interested").length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-4 mt-6">
            {filteredMatches.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-10">
                  <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium">No matches found</h3>
                  <p className="text-muted-foreground text-center mt-2">
                    Click "Find New Matches" to discover potential startups
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} userType="investor" onStatusUpdate={updateMatchStatus} />
                ))}
              </div>
            )}
          </TabsContent>

          {["pending", "interested", "meeting-scheduled", "not-interested"].map((status) => (
            <TabsContent key={status} value={status} className="space-y-4 mt-6">
              {filteredMatches.length === 0 ? (
                <Card>
                  <CardContent className="flex flex-col items-center justify-center py-10">
                    <Building2 className="h-12 w-12 text-muted-foreground mb-4" />
                    <h3 className="text-lg font-medium">No {status.replace("-", " ")} matches</h3>
                    <p className="text-muted-foreground text-center mt-2">
                      {status === "pending" && "No matches awaiting your review"}
                      {status === "interested" && "You haven't expressed interest in any startups yet"}
                      {status === "meeting-scheduled" && "No meetings scheduled with startups"}
                      {status === "not-interested" && "You haven't passed on any matches yet"}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {filteredMatches.map((match) => (
                    <MatchCard key={match.id} match={match} userType="investor" onStatusUpdate={updateMatchStatus} />
                  ))}
                </div>
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </>
  )
}
