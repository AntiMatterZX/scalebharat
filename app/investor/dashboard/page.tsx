"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/supabase"
import { 
  Eye, 
  Users, 
  Calendar, 
  TrendingUp, 
  AlertCircle, 
  Heart, 
  Loader2, 
  MessageSquare,
  Building2,
  Search,
  Star,
  ArrowUpRight,
  Activity,
  Target,
  DollarSign,
  MapPin,
  ExternalLink
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { useAuth } from "@/components/providers"

type InvestorProfile = Database["public"]["Tables"]["investors"]["Row"]
type InvestorDashboardData = {
  investorData: InvestorProfile
  stats: {
    profileViews: number
    totalMatches: number
    interestedStartups: number
    meetingsScheduled: number
    wishlistCount: number
  }
  upcomingMeetings: any[]
  recentActivity: any[]
}

export default function InvestorDashboardPage() {
  const { user } = useAuth()
  const { toast } = useToast()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<InvestorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const initializePage = async () => {
      setLoading(true)
      setError(null)

      try {
        // Get the current session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession()

        if (sessionError) {
          console.error("Session error:", sessionError)
          setError("Failed to get session. Please try logging in again.")
          setLoading(false)
          return
        }

        if (!session?.user) {
          setError("User not authenticated. Please log in.")
          setLoading(false)
          router.push("/auth/login")
          return
        }

        // Fetch dashboard data from API
        const response = await fetch("/api/dashboard/investor", {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          credentials: "include",
        })

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({ error: "Unknown error" }))
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
        }

        const data: InvestorDashboardData = await response.json()
        setDashboardData(data)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching investor dashboard data:", err)
        const errorMessage = err.message || "An unexpected error occurred."
        setError(errorMessage)
        toast({
          title: "Error Loading Dashboard",
          description: errorMessage,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    initializePage()
  }, [toast, router, user])

  const getStatusBadge = (status: InvestorProfile["status"] | undefined) => {
    if (!status) return null
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <div className="w-1.5 h-1.5 bg-green-600 rounded-full mr-1.5"></div>
            Active
          </Badge>
        )
      case "inactive":
        return (
          <Badge variant="outline">
            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full mr-1.5"></div>
            Inactive
          </Badge>
        )
      case "suspended":
        return (
          <Badge variant="destructive">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full mr-1.5"></div>
            Suspended
          </Badge>
        )
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  if (loading) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <div className="flex items-center justify-center h-64 sm:h-80">
          <div className="text-center space-y-4">
            <Loader2 className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 animate-spin text-primary mx-auto" />
            <p className="text-sm sm:text-base text-muted-foreground">Loading your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  if (error || !dashboardData?.investorData) {
    return (
      <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-6 sm:py-8 lg:py-12">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-12 h-12 sm:w-16 sm:h-16 bg-destructive/10 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-destructive" />
            </div>
            <CardTitle className="text-lg sm:text-xl lg:text-2xl text-destructive">Dashboard Error</CardTitle>
            <CardDescription className="text-sm sm:text-base">
              {error || "Could not load investor profile."}
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {error?.includes("Investor profile not found") && (
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/onboarding/investor">Complete Your Profile</Link>
                </Button>
              )}
              {error?.includes("User not authenticated") && (
                <Button asChild className="w-full sm:w-auto">
                  <Link href="/auth/login">Log In</Link>
                </Button>
              )}
              {!error?.includes("Investor profile not found") && !error?.includes("User not authenticated") && (
                <Button onClick={() => window.location.reload()} className="w-full sm:w-auto">Try Again</Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const { investorData, stats, upcomingMeetings, recentActivity } = dashboardData

  return (
    <div className="container mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-4 sm:py-6 lg:py-8 space-y-6 sm:space-y-8">
      {/* Enhanced Header Section */}
      <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start gap-4 lg:gap-6">
        <div className="space-y-2 sm:space-y-3 flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-foreground">
              Welcome back{investorData.firm_name ? `, ${investorData.firm_name}` : ''}
            </h1>
            {getStatusBadge(investorData.status)}
          </div>
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground">
            Manage your investments and discover promising startups
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:flex-shrink-0">
          <Button asChild variant="outline" size="sm" className="w-full sm:w-auto">
            <Link href="/investor/startups">
              <Search className="h-4 w-4 mr-2" />
              Browse Startups
            </Link>
          </Button>
          <Button asChild size="sm" className="w-full sm:w-auto">
            <Link href="/investor/matches">
              <Users className="h-4 w-4 mr-2" />
              View Matches
            </Link>
          </Button>
        </div>
      </div>

      {/* Enhanced Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-6">
        {[
          {
            title: "Profile Views",
            value: stats.profileViews,
            subtitle: "This month",
            icon: Eye,
            color: "text-blue-600 dark:text-blue-400",
            bgColor: "bg-blue-100 dark:bg-blue-900/20",
            change: "+12%",
            changeType: "positive"
          },
          {
            title: "Total Matches",
            value: stats.totalMatches,
            subtitle: "Active matches",
            icon: Users,
            color: "text-green-600 dark:text-green-400",
            bgColor: "bg-green-100 dark:bg-green-900/20",
            change: "+8%",
            changeType: "positive"
          },
          {
            title: "Interested",
            value: stats.interestedStartups,
            subtitle: "Startup interest",
            icon: Heart,
            color: "text-red-600 dark:text-red-400",
            bgColor: "bg-red-100 dark:bg-red-900/20",
            change: "+5%",
            changeType: "positive"
          },
          {
            title: "Meetings",
            value: stats.meetingsScheduled,
            subtitle: "Scheduled",
            icon: Calendar,
            color: "text-orange-600 dark:text-orange-400",
            bgColor: "bg-orange-100 dark:bg-orange-900/20",
            change: "+3",
            changeType: "positive"
          },
          {
            title: "Wishlist",
            value: stats.wishlistCount,
            subtitle: "Saved startups",
            icon: Star,
            color: "text-purple-600 dark:text-purple-400",
            bgColor: "bg-purple-100 dark:bg-purple-900/20",
            change: "+2",
            changeType: "positive"
          }
        ].map((stat, index) => (
          <Card key={stat.title} className="relative overflow-hidden group hover:shadow-lg transition-all duration-300 border border-border bg-card">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 sm:pb-3">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground line-clamp-1">
                {stat.title}
              </CardTitle>
              <div className={cn("p-1.5 sm:p-2 rounded-lg flex-shrink-0 transition-transform group-hover:scale-110", stat.bgColor)}>
                <stat.icon className={cn("h-3 w-3 sm:h-4 sm:w-4", stat.color)} />
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-1">
                <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-foreground">{stat.value}</div>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground line-clamp-1">{stat.subtitle}</p>
                  <span className={cn(
                    "text-xs font-medium",
                    stat.changeType === "positive" ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                  )}>
                    {stat.change}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enhanced Main Content Grid */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 sm:gap-8">
        {/* Investment Focus - Enhanced */}
        <Card className="xl:col-span-2 border border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl lg:text-2xl flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  Investment Focus
                </CardTitle>
                <CardDescription className="text-sm sm:text-base mt-1">
                  Your current investment preferences and criteria
                </CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/investor/settings">
                  <Search className="h-4 w-4 mr-2" />
                  Edit
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Investment Range */}
            <div className="p-4 rounded-lg bg-muted/50 border border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <DollarSign className="h-4 w-4 text-green-600" />
                <h3 className="font-semibold text-sm sm:text-base">Investment Range</h3>
              </div>
              <p className="text-lg sm:text-xl font-bold text-foreground">
                {investorData.check_size_min && investorData.check_size_max
                  ? `$${investorData.check_size_min.toLocaleString()} - $${investorData.check_size_max.toLocaleString()}`
                  : "Range not specified"}
              </p>
            </div>

            {/* Industries */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Building2 className="h-4 w-4 text-blue-600" />
                <h3 className="font-semibold text-sm sm:text-base">Industries</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {investorData.investment_industries && investorData.investment_industries.length > 0 ? (
                  investorData.investment_industries.map((industry: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {industry}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No industries specified</p>
                )}
              </div>
            </div>

            {/* Investment Stages */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <TrendingUp className="h-4 w-4 text-purple-600" />
                <h3 className="font-semibold text-sm sm:text-base">Investment Stages</h3>
              </div>
              <div className="flex flex-wrap gap-2">
                {investorData.investment_stages && investorData.investment_stages.length > 0 ? (
                  investorData.investment_stages.map((stage: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs hover:bg-primary hover:text-primary-foreground transition-colors">
                      {stage}
                    </Badge>
                  ))
                ) : (
                  <p className="text-xs sm:text-sm text-muted-foreground">No investment stages specified</p>
                )}
              </div>
            </div>

            {/* Geographies */}
            {investorData.investment_geographies && investorData.investment_geographies.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <MapPin className="h-4 w-4 text-orange-600" />
                  <h3 className="font-semibold text-sm sm:text-base">Geographies</h3>
                </div>
                <div className="flex flex-wrap gap-2">
                  {investorData.investment_geographies.map((geo: string, index: number) => (
                    <Badge key={index} variant="outline" className="text-xs">
                      {geo}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Meetings - Enhanced */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Upcoming Meetings
                </CardTitle>
                <CardDescription className="text-sm">Your scheduled startup meetings</CardDescription>
              </div>
              <Button variant="outline" size="sm" asChild>
                <Link href="/investor/meetings">
                  <ExternalLink className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.slice(0, 3).map((meeting) => (
                  <div key={meeting.id} className="flex items-start gap-3 p-3 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/50 transition-colors">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Calendar className="h-4 w-4 text-primary" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm sm:text-base truncate">{meeting.startup || "Startup Meeting"}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString()} at{" "}
                        {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      <Badge
                        variant={meeting.status === "confirmed" ? "default" : "secondary"}
                        className="text-xs mt-1"
                      >
                        {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                      </Badge>
                    </div>
                  </div>
                ))}
                {upcomingMeetings.length > 3 && (
                  <Button variant="outline" size="sm" className="w-full" asChild>
                    <Link href="/investor/meetings">
                      View All {upcomingMeetings.length} Meetings
                      <ArrowUpRight className="h-4 w-4 ml-2" />
                    </Link>
                  </Button>
                )}
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Calendar className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">No upcoming meetings</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/investor/meetings">Schedule a Meeting</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
        {/* Recent Activity */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Recent Activity
            </CardTitle>
            <CardDescription className="text-sm sm:text-base">Latest activity on your profile</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity && recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.slice(0, 4).map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 pb-3 border-b border-border/50 last:border-0 last:pb-0">
                    <div
                      className={cn(
                        "w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0",
                        activity.type === "view"
                          ? "bg-blue-100 dark:bg-blue-900/20"
                          : activity.type === "match"
                            ? "bg-green-100 dark:bg-green-900/20"
                            : "bg-purple-100 dark:bg-purple-900/20"
                      )}
                    >
                      {activity.type === "view" ? (
                        <Eye className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      ) : activity.type === "match" ? (
                        <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                      ) : (
                        <MessageSquare className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base">{activity.message}</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">
                        {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                        {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 space-y-3">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto">
                  <Activity className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground text-sm sm:text-base">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="border border-border bg-card">
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Quick Actions</CardTitle>
            <CardDescription className="text-sm sm:text-base">Common tasks and shortcuts</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 gap-3">
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/investor/startups" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/20 flex items-center justify-center">
                    <Search className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Browse Startups</div>
                    <div className="text-xs text-muted-foreground">Discover new investment opportunities</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/investor/matches" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/20 flex items-center justify-center">
                    <Users className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">View Matches</div>
                    <div className="text-xs text-muted-foreground">See startups matching your criteria</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/investor/analytics" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/20 flex items-center justify-center">
                    <TrendingUp className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Analytics</div>
                    <div className="text-xs text-muted-foreground">Track your investment performance</div>
                  </div>
                </Link>
              </Button>
              
              <Button asChild variant="outline" className="justify-start h-auto p-4">
                <Link href="/investor/messages" className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium text-sm">Messages</div>
                    <div className="text-xs text-muted-foreground">Communicate with startups</div>
                  </div>
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
