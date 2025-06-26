"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { MatchCard } from "@/components/matches/match-card"
import { useAuth } from "@/components/providers"
import { supabase } from "@/lib/supabase"
import { 
  Loader2, 
  RefreshCw, 
  Building2, 
  TrendingUp, 
  Calendar,
  AlertCircle,
  Users,
  Heart,
  MessageSquare,
  Filter,
  Search,
  ThumbsUp,
  ThumbsDown
} from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

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
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center h-64 sm:h-80">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 animate-spin text-primary mx-auto" />
            <p className="text-sm sm:text-base text-muted-foreground">Finding your startup matches...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!investorProfile) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-primary" />
            </div>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl">Complete Your Profile</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              You need to complete your investor profile to see startup matches
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Button asChild className="w-full sm:w-auto">
              <a href="/investor/profile">Complete Profile</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
      {/* Enhanced Header */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
        <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
            Startup Matches
          </h1>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Discover startups that match your investment criteria
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
          <Button 
            variant="outline" 
            size="sm" 
            className="w-full sm:w-auto"
            onClick={() => window.location.reload()}
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={generateMatches} 
            disabled={generating}
            size="sm"
            className="w-full sm:w-auto"
          >
            {generating ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Search className="h-4 w-4 mr-2" />
            )}
            {generating ? "Generating..." : "Find New Matches"}
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 lg:gap-6">
        {[
          {
            title: "Total Matches",
            value: matches.length,
            subtitle: "All matches",
            icon: Building2,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-900/20"
          },
          {
            title: "Interested",
            value: matches.filter((m) => m.status === "interested").length,
            subtitle: "You're interested",
            icon: Heart,
            color: "text-red-600 dark:text-red-400",
            bgColor: "bg-red-100 dark:bg-red-900/20"
          },
          {
            title: "Meetings",
            value: matches.filter((m) => m.status === "meeting-scheduled").length,
            subtitle: "Scheduled",
            icon: Calendar,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-900/20"
          },
          {
            title: "Active",
            value: matches.filter((m) => ["interested", "meeting-scheduled"].includes(m.status)).length,
            subtitle: "In progress",
            icon: TrendingUp,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-100 dark:bg-purple-900/20"
          }
        ].map((stat, index) => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border bg-card">
            <CardContent className="p-3 sm:p-4 lg:p-6">
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-transform group-hover:scale-110", stat.bgColor)}>
                  <stat.icon className={cn("h-3 w-3 sm:h-4 sm:w-4 lg:h-5 lg:w-5", stat.color)} />
                </div>
              </div>
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-medium text-foreground line-clamp-1">{stat.title}</p>
                  <p className="text-xs text-muted-foreground line-clamp-1">{stat.subtitle}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Tabs */}
      <Tabs defaultValue="all" onValueChange={setActiveTab} className="w-full">
        <div className="overflow-x-auto scrollbar-hide pb-2">
          <TabsList className="inline-flex h-12 items-center justify-start rounded-xl bg-muted/50 p-1 text-muted-foreground gap-1 min-w-fit">
            <TabsTrigger 
              value="all" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:bg-background/50 min-w-fit"
            >
              <Building2 className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">All Matches</span>
              <span className="sm:hidden">All</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs h-5">
                {matches.length}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="pending" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:bg-background/50 min-w-fit"
            >
              <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Pending</span>
              <span className="sm:hidden">Pending</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs h-5">
                {matches.filter((m) => m.status === "pending").length}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="interested" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:bg-background/50 min-w-fit"
            >
              <ThumbsUp className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Interested</span>
              <span className="sm:hidden">Interest</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs h-5">
                {matches.filter((m) => m.status === "interested").length}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="meeting-scheduled" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:shadow-md hover:bg-background/50 min-w-fit"
            >
              <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Meetings</span>
              <span className="sm:hidden">Meetings</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs h-5">
                {matches.filter((m) => m.status === "meeting-scheduled").length}
              </Badge>
            </TabsTrigger>
            
            <TabsTrigger 
              value="not-interested" 
              className="inline-flex items-center justify-center whitespace-nowrap rounded-lg px-3 py-2 text-xs sm:text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 data-[state=active]:bg-background data-[state=active]:text-foreground data-[state=active]:shadow-md hover:bg-background/50 min-w-fit"
            >
              <ThumbsDown className="h-3 w-3 sm:h-4 sm:w-4 mr-1.5 sm:mr-2" />
              <span className="hidden sm:inline">Passed</span>
              <span className="sm:hidden">Passed</span>
              <Badge variant="secondary" className="ml-1 sm:ml-2 text-xs h-5">
                {matches.filter((m) => m.status === "not-interested").length}
              </Badge>
            </TabsTrigger>
          </TabsList>
        </div>

        {/* Enhanced Tab Content */}
        <TabsContent value="all" className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
          {filteredMatches.length === 0 ? (
            <Card className="border-dashed border-2 border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-4">
                <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mb-4 sm:mb-6">
                  <Building2 className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />
                </div>
                <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">No matches found</h3>
                <p className="text-sm sm:text-base text-muted-foreground text-center mb-6 max-w-md">
                  Click "Find New Matches" to discover potential startup investments that align with your criteria
                </p>
                <Button onClick={generateMatches} disabled={generating} className="w-full sm:w-auto">
                  {generating ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4 mr-2" />
                  )}
                  {generating ? "Generating..." : "Find New Matches"}
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
              {filteredMatches.map((match) => (
                <MatchCard key={match.id} match={match} userType="investor" onStatusUpdate={updateMatchStatus} />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Other Tab Contents */}
        {["pending", "interested", "meeting-scheduled", "not-interested"].map((status) => (
          <TabsContent key={status} value={status} className="space-y-4 sm:space-y-6 mt-4 sm:mt-6">
            {filteredMatches.length === 0 ? (
              <Card className="border-dashed border-2 border-border/50">
                <CardContent className="flex flex-col items-center justify-center py-12 sm:py-16 lg:py-20 px-4">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-muted rounded-full flex items-center justify-center mb-4 sm:mb-6">
                    {status === "pending" && <AlertCircle className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />}
                    {status === "interested" && <Heart className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />}
                    {status === "meeting-scheduled" && <Calendar className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />}
                    {status === "not-interested" && <ThumbsDown className="h-8 w-8 sm:h-10 sm:w-10 text-muted-foreground" />}
                  </div>
                  <h3 className="text-lg sm:text-xl font-semibold text-foreground mb-2">
                    No {status.replace("-", " ")} matches
                  </h3>
                  <p className="text-sm sm:text-base text-muted-foreground text-center max-w-md">
                    {status === "pending" && "No matches awaiting your review"}
                    {status === "interested" && "You haven't expressed interest in any startups yet"}
                    {status === "meeting-scheduled" && "No meetings scheduled with startups"}
                    {status === "not-interested" && "You haven't passed on any matches yet"}
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 sm:gap-6">
                {filteredMatches.map((match) => (
                  <MatchCard key={match.id} match={match} userType="investor" onStatusUpdate={updateMatchStatus} />
                ))}
              </div>
            )}
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}
