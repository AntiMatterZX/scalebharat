"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import { Eye, Users, Calendar, TrendingUp, AlertCircle, Clock, Heart, Loader2, MessageSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

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
  const { toast } = useToast()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<InvestorDashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

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

        setUser(session.user)

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
  }, [toast, router])

  const getStatusBadge = (status: InvestorProfile["status"] | undefined) => {
    if (!status) return null
    switch (status) {
      case "active":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            Active
          </Badge>
        )
      case "pending":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending
          </Badge>
        )
      case "inactive":
        return <Badge variant="outline">Inactive</Badge>
      case "suspended":
        return <Badge variant="destructive">Suspended</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
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

  if (error || !dashboardData?.investorData) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="mb-4 text-lg">{error || "Could not load investor profile."}</p>
            {error?.includes("Investor profile not found") && (
              <Link href="/onboarding/investor">
                <Button>Complete Your Profile</Button>
              </Link>
            )}
            {error?.includes("User not authenticated") && (
              <Link href="/auth/login">
                <Button>Log In</Button>
              </Link>
            )}
            {!error?.includes("Investor profile not found") && !error?.includes("User not authenticated") && (
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { investorData, stats, upcomingMeetings, recentActivity } = dashboardData

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{investorData.firm_name || "Your Dashboard"}</h1>
          <p className="text-muted-foreground">{investorData.tagline || "Welcome to your investor dashboard"}</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">{getStatusBadge(investorData.status)}</div>
      </div>

      {investorData.status === "pending" && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your profile is currently pending approval. Some features may be limited until approved. You can still{" "}
            <Link href="/investor/profile" className="font-semibold underline">
              edit your profile
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Profile Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.profileViews}</div>
            <p className="text-xs text-muted-foreground">This month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Matches</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalMatches}</div>
            <p className="text-xs text-muted-foreground">Total matches</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Interested Startups</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interestedStartups}</div>
            <p className="text-xs text-muted-foreground">Showing interest</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meetings</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.meetingsScheduled}</div>
            <p className="text-xs text-muted-foreground">Scheduled</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Wishlist</CardTitle>
            <Heart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.wishlistCount}</div>
            <p className="text-xs text-muted-foreground">Saved startups</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Investment Focus</CardTitle>
            <CardDescription>Your current investment preferences</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Industries</h3>
                <div className="flex flex-wrap gap-2">
                  {investorData.industries && investorData.industries.length > 0 ? (
                    investorData.industries.map((industry: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {industry}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No industries specified</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Investment Stages</h3>
                <div className="flex flex-wrap gap-2">
                  {investorData.investment_stages && investorData.investment_stages.length > 0 ? (
                    investorData.investment_stages.map((stage: string, index: number) => (
                      <Badge key={index} variant="secondary">
                        {stage}
                      </Badge>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No investment stages specified</p>
                  )}
                </div>
              </div>
              <div>
                <h3 className="font-medium mb-2">Investment Range</h3>
                <p>
                  {investorData.min_investment && investorData.max_investment
                    ? `$${investorData.min_investment.toLocaleString()} - $${investorData.max_investment.toLocaleString()}`
                    : "Not specified"}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>Your scheduled startup meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings && upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{meeting.startup || "Startup"}</p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(meeting.date).toLocaleDateString()} at{" "}
                        {new Date(meeting.date).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <div>
                      <span
                        className={`px-2 py-1 text-xs rounded-full ${
                          meeting.status === "confirmed"
                            ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200"
                            : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200"
                        }`}
                      >
                        {meeting.status === "confirmed" ? "Confirmed" : "Pending"}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-muted-foreground">No upcoming meetings</p>
                <Button variant="outline" className="mt-2" asChild>
                  <Link href="/investor/meetings">Schedule a Meeting</Link>
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="activity">
        <TabsList className="mb-4">
          <TabsTrigger value="activity">Recent Activity</TabsTrigger>
          <TabsTrigger value="matches">Matches</TabsTrigger>
          <TabsTrigger value="messages">Messages</TabsTrigger>
        </TabsList>
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>The latest activity on your profile</CardDescription>
            </CardHeader>
            <CardContent>
              {recentActivity && recentActivity.length > 0 ? (
                <div className="space-y-4">
                  {recentActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-4 border-b pb-4 last:border-0">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          activity.type === "view"
                            ? "bg-blue-100 dark:bg-blue-900"
                            : activity.type === "match"
                              ? "bg-green-100 dark:bg-green-900"
                              : "bg-purple-100 dark:bg-purple-900"
                        }`}
                      >
                        {activity.type === "view" ? (
                          <Eye className="h-5 w-5 text-blue-600 dark:text-blue-300" />
                        ) : activity.type === "match" ? (
                          <Users className="h-5 w-5 text-green-600 dark:text-green-300" />
                        ) : (
                          <MessageSquare className="h-5 w-5 text-purple-600 dark:text-purple-300" />
                        )}
                      </div>
                      <div>
                        <p>{activity.message}</p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(activity.timestamp).toLocaleDateString()} at{" "}
                          {new Date(activity.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-muted-foreground">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="matches">
          <Card>
            <CardHeader>
              <CardTitle>Your Matches</CardTitle>
              <CardDescription>Startups that match your investment criteria</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your matches will appear here</p>
                <Link href="/investor/matches">
                  <Button variant="outline" className="mt-2">
                    View All Matches
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="messages">
          <Card>
            <CardHeader>
              <CardTitle>Recent Messages</CardTitle>
              <CardDescription>Your conversations with startups</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your messages will appear here</p>
                <Link href="/investor/messages">
                  <Button variant="outline" className="mt-2">
                    View All Messages
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
