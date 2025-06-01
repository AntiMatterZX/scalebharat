"use client"

import { Alert, AlertDescription } from "@/components/ui/alert"
import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { supabase } from "@/lib/supabase"
import {
  Eye,
  Users,
  Calendar,
  TrendingUp,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Clock,
  ThumbsUp,
  Loader2,
  MessageSquare,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import type { Database } from "@/types/database"
import { useToast } from "@/components/ui/use-toast"
import { useRouter } from "next/navigation"

type StartupProfile = Database["public"]["Tables"]["startups"]["Row"]
type StartupDashboardData = {
  startupData: StartupProfile
  stats: {
    profileViews: number
    totalMatches: number
    interestedInvestors: number
    meetingsScheduled: number
  }
  fundingStats: {
    goal: number
    raised: number
    percentage: number
  }
  upcomingMeetings: any[]
  recentActivity: any[]
}

export default function StartupDashboardPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [dashboardData, setDashboardData] = useState<StartupDashboardData | null>(null)
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
        const response = await fetch("/api/dashboard/startup", {
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

        const data: StartupDashboardData = await response.json()
        setDashboardData(data)
        setError(null)
      } catch (err: any) {
        console.error("Error fetching startup dashboard data:", err)
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

  const getStatusBadge = (status: StartupProfile["status"] | undefined) => {
    if (!status) return null
    switch (status) {
      case "published":
        return (
          <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
            <CheckCircle className="mr-1 h-3 w-3" />
            Published
          </Badge>
        )
      case "pending_approval":
        return (
          <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            <Clock className="mr-1 h-3 w-3" />
            Pending Approval
          </Badge>
        )
      case "draft":
        return <Badge variant="outline">Draft</Badge>
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

  if (error || !dashboardData?.startupData) {
    return (
      <div className="container mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle className="text-destructive">Dashboard Error</CardTitle>
          </CardHeader>
          <CardContent className="p-6 text-center">
            <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
            <p className="mb-4 text-lg">{error || "Could not load startup profile."}</p>
            {error?.includes("Startup profile not found") && (
              <Link href="/onboarding/startup">
                <Button>Complete Your Profile</Button>
              </Link>
            )}
            {error?.includes("User not authenticated") && (
              <Link href="/auth/login">
                <Button>Log In</Button>
              </Link>
            )}
            {!error?.includes("Startup profile not found") && !error?.includes("User not authenticated") && (
              <Button onClick={() => window.location.reload()}>Try Again</Button>
            )}
          </CardContent>
        </Card>
      </div>
    )
  }

  const { startupData, stats, fundingStats, upcomingMeetings, recentActivity } = dashboardData

  return (
    <div className="container mx-auto py-6">
      <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">{startupData.company_name || "Your Startup"}</h1>
          <p className="text-muted-foreground">{startupData.tagline || "Welcome to your startup dashboard"}</p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-2">
          {getStatusBadge(startupData.status)}
          <div className="flex items-center text-sm text-muted-foreground">
            <ThumbsUp className="h-4 w-4 mr-1 text-primary" />
            <span>{startupData.upvote_count || 0} Upvotes</span>
          </div>
        </div>
      </div>

      {startupData.status === "pending_approval" && (
        <Alert className="mb-6 border-yellow-200 bg-yellow-50 dark:border-yellow-800 dark:bg-yellow-950">
          <Clock className="h-4 w-4" />
          <AlertDescription>
            Your profile is currently pending approval by our team. Some features may be limited until approved. You can
            still{" "}
            <Link href={`/startup/profile/edit`} className="font-semibold underline">
              edit your profile
            </Link>
            .
          </AlertDescription>
        </Alert>
      )}
      {startupData.status === "draft" && (
        <Alert className="mb-6 border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Your profile is currently a draft and not visible to investors.
            <Link href="/onboarding/startup/review" className="font-semibold underline ml-1">
              Review and submit for approval
            </Link>{" "}
            when you're ready.
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
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
            <CardTitle className="text-sm font-medium">Interested Investors</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.interestedInvestors}</div>
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
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Funding Progress</CardTitle>
            <CardDescription>
              {fundingStats.raised.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              })}{" "}
              raised of{" "}
              {fundingStats.goal.toLocaleString("en-US", {
                style: "currency",
                currency: "USD",
                maximumFractionDigits: 0,
              })}{" "}
              goal
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <DollarSign className="h-5 w-5 text-green-500 mr-2" />
                  <span className="font-medium">Current Round: {startupData.current_round || "N/A"}</span>
                </div>
                <span className="font-medium">{fundingStats.percentage.toFixed(1)}%</span>
              </div>
              <Progress value={fundingStats.percentage} className="h-2" />
              <div className="grid grid-cols-2 gap-4 pt-4">
                <div>
                  <p className="text-sm text-muted-foreground">Raised</p>
                  <p className="text-lg font-bold">
                    {fundingStats.raised.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Goal</p>
                  <p className="text-lg font-bold">
                    {fundingStats.goal.toLocaleString("en-US", {
                      style: "currency",
                      currency: "USD",
                      maximumFractionDigits: 0,
                    })}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Upcoming Meetings</CardTitle>
            <CardDescription>Your scheduled investor meetings</CardDescription>
          </CardHeader>
          <CardContent>
            {upcomingMeetings.length > 0 ? (
              <div className="space-y-4">
                {upcomingMeetings.map((meeting) => (
                  <div key={meeting.id} className="flex justify-between items-center border-b pb-3 last:border-0">
                    <div>
                      <p className="font-medium">{meeting.investor || "Investor"}</p>
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
                  <Link href="/startup/meetings">Schedule a Meeting</Link>
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
              {recentActivity.length > 0 ? (
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
              <CardDescription>Investors that match your startup profile</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your matches will appear here</p>
                <Link href="/startup/matches">
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
              <CardDescription>Your conversations with investors</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-muted-foreground">Your messages will appear here</p>
                <Link href="/startup/messages">
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
